pub mod users;
pub mod friend_collections;
pub mod groups;
pub mod group_members;
pub mod activities;
pub mod transactions;
pub mod upi_payments;
pub mod cash_transactions;
pub mod notifications;

pub mod prelude {
    pub use super::users::Entity as Users;
    pub use super::friend_collections::Entity as FriendCollections;
    pub use super::groups::Entity as Groups;
    pub use super::group_members::Entity as GroupMembers;
    pub use super::activities::Entity as Activities;
    pub use super::transactions::Entity as Transactions;
    pub use super::upi_payments::Entity as UpiPayments;
    pub use super::cash_transactions::Entity as CashTransactions;
    pub use super::notifications::Entity as Notifications;
}