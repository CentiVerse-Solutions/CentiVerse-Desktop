use sea_orm_migration::prelude::*;
use sea_query::Table;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(CashTransactions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(CashTransactions::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(CashTransactions::TransactionId).uuid().not_null())
                    .col(
                        ColumnDef::new(CashTransactions::CashAmount)
                            .decimal()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(CashTransactions::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(CashTransactions::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(CashTransactions::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum CashTransactions {
    Table,
    Id,
    TransactionId,
    CashAmount,
    CreatedAt,
    UpdatedAt,
}
