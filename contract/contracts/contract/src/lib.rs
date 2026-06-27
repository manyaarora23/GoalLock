#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Map, String, Vec, symbol_short, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct Goal {
    pub owner: Address,
    pub title: String,
    pub target_amount: i128,
    pub balance: i128,
    pub unlock_timestamp: u64,
    pub created_at: u64,
    pub withdrawn: bool,
}

#[contracttype]
pub enum DataKey {
    Token,
    Goals,
    NextId,
    OwnerGoals,
}

const EVENT_GOAL_CREATED: Symbol = symbol_short!("goal_cr");
const EVENT_DEPOSIT: Symbol = symbol_short!("deposit");
const EVENT_WITHDRAW: Symbol = symbol_short!("withdraw");

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env, token: Address) {
        assert!(!env.storage().instance().has(&DataKey::Token), "already initialized");
        env.storage().instance().set(&DataKey::Token, &token);
    }

    pub fn create_goal(
        env: Env,
        owner: Address,
        title: String,
        target_amount: i128,
        unlock_timestamp: u64,
    ) -> u64 {
        owner.require_auth();
        let mut next_id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        next_id += 1;
        let goal = Goal {
            owner: owner.clone(),
            title,
            target_amount,
            balance: 0,
            unlock_timestamp,
            created_at: env.ledger().timestamp(),
            withdrawn: false,
        };
        let mut goals: Map<u64, Goal> =
            env.storage().instance().get(&DataKey::Goals).unwrap_or(Map::new(&env));
        goals.set(next_id, goal);
        env.storage().instance().set(&DataKey::Goals, &goals);
        env.storage().instance().set(&DataKey::NextId, &next_id);

        let mut owner_goals: Map<Address, Vec<u64>> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerGoals)
            .unwrap_or(Map::new(&env));
        let mut ids = owner_goals.get(owner.clone()).unwrap_or(Vec::new(&env));
        ids.push_back(next_id);
        owner_goals.set(owner, ids);
        env.storage().persistent().set(&DataKey::OwnerGoals, &owner_goals);

        env.events().publish((EVENT_GOAL_CREATED,), (next_id,));
        next_id
    }

    pub fn deposit(env: Env, owner: Address, goal_id: u64, amount: i128) {
        owner.require_auth();
        assert!(amount > 0, "amount must be positive");
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let mut goals: Map<u64, Goal> =
            env.storage().instance().get(&DataKey::Goals).unwrap();
        let mut goal = goals.get(goal_id).expect("goal not found");
        assert_eq!(goal.owner, owner, "not your goal");
        assert!(!goal.withdrawn, "already withdrawn");
        token::Client::new(&env, &token_addr)
            .transfer(&owner, &env.current_contract_address(), &amount);
        goal.balance += amount;
        goals.set(goal_id, goal);
        env.storage().instance().set(&DataKey::Goals, &goals);
        env.events().publish((EVENT_DEPOSIT,), (goal_id, amount));
    }

    pub fn withdraw(env: Env, owner: Address, goal_id: u64) {
        owner.require_auth();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let mut goals: Map<u64, Goal> =
            env.storage().instance().get(&DataKey::Goals).unwrap();
        let mut goal = goals.get(goal_id).expect("goal not found");
        assert_eq!(goal.owner, owner, "not your goal");
        assert!(!goal.withdrawn, "already withdrawn");
        assert!(
            env.ledger().timestamp() >= goal.unlock_timestamp,
            "funds still locked"
        );
        assert!(goal.balance > 0, "no funds to withdraw");
        let balance = goal.balance;
        goal.balance = 0;
        goal.withdrawn = true;
        goals.set(goal_id, goal);
        env.storage().instance().set(&DataKey::Goals, &goals);
        token::Client::new(&env, &token_addr)
            .transfer(&env.current_contract_address(), &owner, &balance);
        env.events().publish((EVENT_WITHDRAW,), (goal_id, balance));
    }

    pub fn get_goal(env: Env, goal_id: u64) -> Goal {
        let goals: Map<u64, Goal> =
            env.storage().instance().get(&DataKey::Goals).unwrap();
        goals.get(goal_id).expect("goal not found")
    }

    pub fn get_user_goals(env: Env, owner: Address) -> Vec<Goal> {
        let owner_goals: Map<Address, Vec<u64>> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerGoals)
            .unwrap_or(Map::new(&env));
        let ids = owner_goals.get(owner).unwrap_or(Vec::new(&env));
        let all_goals: Map<u64, Goal> =
            env.storage().instance().get(&DataKey::Goals).unwrap();
        let mut result = Vec::new(&env);
        for i in 0..ids.len() {
            if let Some(g) = all_goals.get(ids.get(i).unwrap()) {
                result.push_back(g);
            }
        }
        result
    }

    pub fn get_goals_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::NextId).unwrap_or(0)
    }
}

mod test;
