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
                    .table(Transactions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Transactions::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Transactions::PayerId).uuid().not_null())
                    .col(ColumnDef::new(Transactions::ReceiverId).uuid().not_null())
                    .col(
                        ColumnDef::new(Transactions::Amount)
                            .decimal()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Transactions::Method).string().not_null())
                    .col(
                        ColumnDef::new(Transactions::Time)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Transactions::Status).string().not_null())
                    .col(ColumnDef::new(Transactions::GroupId).uuid().not_null())
                    .col(ColumnDef::new(Transactions::ActivityId).uuid().not_null())
                    .col(
                        ColumnDef::new(Transactions::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Transactions::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Transactions::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Transactions {
    Table,
    Id,
    PayerId,
    ReceiverId,
    Amount,
    Method,
    Time,
    Status,
    GroupId,
    ActivityId,
    CreatedAt,
    UpdatedAt,
}
