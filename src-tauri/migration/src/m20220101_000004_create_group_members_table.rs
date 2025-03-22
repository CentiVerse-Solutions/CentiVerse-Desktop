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
                    .table(GroupMembers::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(GroupMembers::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(GroupMembers::GroupId).uuid().not_null())
                    .col(ColumnDef::new(GroupMembers::MemberId).uuid().not_null())
                    .col(
                        ColumnDef::new(GroupMembers::JoinedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(GroupMembers::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum GroupMembers {
    Table,
    Id,
    GroupId,
    MemberId,
    JoinedAt,
}
