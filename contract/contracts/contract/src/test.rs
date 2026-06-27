#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::StellarAssetClient,
    Env,
};

fn setup_env(
) -> (
    Env,
    ContractClient<'static>,
    token::Client<'static>,
    StellarAssetClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let token = token::Client::new(&env, &token_addr);
    let admin_client = StellarAssetClient::new(&env, &token_addr);

    admin_client.mint(&user, &1000_0000000);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    client.init(&token_addr);

    (env, client, token, admin_client, user, admin, contract_id)
}

#[test]
fn test_create_goal() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();

    let title = String::from_str(env, "New Laptop");
    let unlock = env.ledger().timestamp() + 86400;

    let goal_id = client.create_goal(&user, &title, &500_0000000, &unlock);
    assert_eq!(goal_id, 1);

    let goal = client.get_goal(&goal_id);
    assert_eq!(goal.owner, user);
    assert_eq!(goal.title, String::from_str(env, "New Laptop"));
    assert_eq!(goal.target_amount, 500_0000000);
    assert_eq!(goal.balance, 0);
    assert_eq!(goal.unlock_timestamp, unlock);
    assert!(!goal.withdrawn);
}

#[test]
fn test_deposit() {
    let (ref env, client, token, _adm_cli, user, _admin, contract_id) = setup_env();

    let title = String::from_str(env, "Vacation Fund");
    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &title, &1000_0000000, &unlock);

    let user_balance_before = token.balance(&user);

    client.deposit(&user, &goal_id, &200_0000000);

    let goal = client.get_goal(&goal_id);
    assert_eq!(goal.balance, 200_0000000);

    let user_balance_after = token.balance(&user);
    assert_eq!(user_balance_before - 200_0000000, user_balance_after);

    let contract_balance = token.balance(&contract_id);
    assert_eq!(contract_balance, 200_0000000);
}

#[test]
fn test_deposit_multiple_times() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();

    let title = String::from_str(env, "Emergency Fund");
    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &title, &1000_0000000, &unlock);

    client.deposit(&user, &goal_id, &100_0000000);
    client.deposit(&user, &goal_id, &250_0000000);
    client.deposit(&user, &goal_id, &150_0000000);

    let goal = client.get_goal(&goal_id);
    assert_eq!(goal.balance, 500_0000000);
}

#[test]
#[should_panic(expected = "not your goal")]
fn test_only_owner_can_deposit() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();
    let other = Address::generate(env);

    let title = String::from_str(env, "My Goal");
    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &title, &500_0000000, &unlock);

    client.deposit(&other, &goal_id, &100_0000000);
}

#[test]
#[should_panic(expected = "funds still locked")]
fn test_early_withdrawal_rejected() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();

    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &String::from_str(env, "Test Goal"), &500_0000000, &unlock);

    client.deposit(&user, &goal_id, &200_0000000);

    env.ledger().with_mut(|li| {
        li.timestamp = unlock - 1;
    });

    client.withdraw(&user, &goal_id);
}

#[test]
#[should_panic(expected = "not your goal")]
fn test_only_owner_can_withdraw() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();
    let other = Address::generate(env);

    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &String::from_str(env, "My Goal"), &500_0000000, &unlock);

    client.deposit(&user, &goal_id, &200_0000000);

    client.withdraw(&other, &goal_id);
}

#[test]
fn test_successful_withdrawal_after_unlock() {
    let (ref env, client, token, _adm_cli, user, _admin, contract_id) = setup_env();

    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &String::from_str(env, "Laptop Fund"), &500_0000000, &unlock);

    client.deposit(&user, &goal_id, &300_0000000);

    env.ledger().with_mut(|li| {
        li.timestamp = unlock + 1;
    });

    let user_balance_before = token.balance(&user);
    let contract_balance_before = token.balance(&contract_id);

    client.withdraw(&user, &goal_id);

    let goal = client.get_goal(&goal_id);
    assert_eq!(goal.balance, 0);
    assert!(goal.withdrawn);

    let user_balance_after = token.balance(&user);
    assert_eq!(user_balance_after, user_balance_before + 300_0000000);

    let contract_balance_after = token.balance(&contract_id);
    assert_eq!(contract_balance_after, contract_balance_before - 300_0000000);
}

#[test]
#[should_panic(expected = "already withdrawn")]
fn test_cannot_withdraw_twice() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();

    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &String::from_str(env, "One-time Goal"), &500_0000000, &unlock);

    client.deposit(&user, &goal_id, &100_0000000);

    env.ledger().with_mut(|li| {
        li.timestamp = unlock + 1;
    });

    client.withdraw(&user, &goal_id);
    client.withdraw(&user, &goal_id);
}

#[test]
fn test_get_user_goals() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();
    let unlock = env.ledger().timestamp() + 86400;

    client.create_goal(&user, &String::from_str(env, "Goal 1"), &100_0000000, &unlock);
    client.create_goal(&user, &String::from_str(env, "Goal 2"), &200_0000000, &unlock);

    let goals = client.get_user_goals(&user);
    assert_eq!(goals.len(), 2);
    assert_eq!(goals.get(0).unwrap().title, String::from_str(env, "Goal 1"));
    assert_eq!(goals.get(1).unwrap().title, String::from_str(env, "Goal 2"));
}

#[test]
fn test_get_goals_count() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();
    let unlock = env.ledger().timestamp() + 86400;
    let title = String::from_str(env, "Test");

    assert_eq!(client.get_goals_count(), 0);
    client.create_goal(&user, &title, &100_0000000, &unlock);
    assert_eq!(client.get_goals_count(), 1);
    client.create_goal(&user, &title, &200_0000000, &unlock);
    assert_eq!(client.get_goals_count(), 2);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_deposit_zero_fails() {
    let (ref env, client, _token, _adm_cli, user, _admin, _contract_id) = setup_env();
    let unlock = env.ledger().timestamp() + 86400;
    let goal_id = client.create_goal(&user, &String::from_str(env, "Test"), &500_0000000, &unlock);
    client.deposit(&user, &goal_id, &0);
}
