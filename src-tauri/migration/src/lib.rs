pub use sea_orm_migration::prelude::*;
use sea_orm_migration::MigratorTrait;

mod m20220101_000001_create_users_table;
mod m20220101_000002_create_groups_table;
mod m20220101_000003_create_friend_collections_table;
mod m20220101_000004_create_group_members_table;
mod m20220101_000005_create_activities_table;
mod m20220101_000006_create_transactions_table;
mod m20220101_000007_create_upi_payments_table;
mod m20220101_000008_create_cash_transactions_table;
mod m20220101_000009_create_notifications_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_users_table::Migration),
            Box::new(m20220101_000002_create_groups_table::Migration),
            Box::new(m20220101_000003_create_friend_collections_table::Migration),
            Box::new(m20220101_000004_create_group_members_table::Migration),
            Box::new(m20220101_000005_create_activities_table::Migration),
            Box::new(m20220101_000006_create_transactions_table::Migration),
            Box::new(m20220101_000007_create_upi_payments_table::Migration),
            Box::new(m20220101_000008_create_cash_transactions_table::Migration),
            Box::new(m20220101_000009_create_notifications_table::Migration),
        ]
    }
}
