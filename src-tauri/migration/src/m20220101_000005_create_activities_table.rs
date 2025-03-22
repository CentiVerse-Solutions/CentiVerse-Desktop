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
                    .table(Activities::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Activities::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Activities::Description).string().null())
                    .col(ColumnDef::new(Activities::PaidById).uuid().not_null())
                    .col(ColumnDef::new(Activities::GroupId).uuid().not_null())
                    .col(
                        ColumnDef::new(Activities::Time)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Activities::Amount)
                            .decimal()
                            .not_null(),
                    )
                    // Storing arrays as JSON
                    .col(ColumnDef::new(Activities::SplitMembers).json().not_null())
                    .col(ColumnDef::new(Activities::SplitAmounts).json().not_null())
                    .col(ColumnDef::new(Activities::UserInvolvement).boolean().not_null())
                    .col(ColumnDef::new(Activities::ExpenseLogo).string().null())
                    .col(
                        ColumnDef::new(Activities::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Activities::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Activities::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Activities {
    Table,
    Id,
    Description,
    PaidById,
    GroupId,
    Time,
    Amount,
    SplitMembers,
    SplitAmounts,
    UserInvolvement,
    ExpenseLogo,
    CreatedAt,
    UpdatedAt,
}
