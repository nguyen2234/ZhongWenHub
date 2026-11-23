using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZhongWenHub.Data.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportTicketEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'support_tickets')
BEGIN
    CREATE TABLE [support_tickets] (
        [Id] uniqueidentifier NOT NULL,
        [TicketNumber] nvarchar(50) NOT NULL,
        [ReporterId] uniqueidentifier NOT NULL,
        [ReporterName] nvarchar(100) NOT NULL,
        [ReporterEmail] nvarchar(200) NOT NULL,
        [ReporterRole] nvarchar(50) NOT NULL,
        [Subject] nvarchar(250) NOT NULL,
        [Description] nvarchar(4000) NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [Priority] nvarchar(30) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [AssigneeId] uniqueidentifier NULL,
        [AssigneeName] nvarchar(100) NOT NULL,
        [ContextModule] nvarchar(100) NULL,
        [ContextUrl] nvarchar(500) NULL,
        [ContentIssueId] nvarchar(50) NULL,
        [SlaDeadline] datetime2 NOT NULL,
        [IsOverdue] bit NOT NULL,
        [ClosedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_support_tickets] PRIMARY KEY ([Id])
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'support_ticket_history')
BEGIN
    CREATE TABLE [support_ticket_history] (
        [Id] uniqueidentifier NOT NULL,
        [TicketId] uniqueidentifier NOT NULL,
        [ActorId] uniqueidentifier NOT NULL,
        [ActorName] nvarchar(100) NOT NULL,
        [ActorRole] nvarchar(50) NOT NULL,
        [Action] nvarchar(500) NOT NULL,
        [Timestamp] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_support_ticket_history] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_support_ticket_history_support_tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [support_tickets] ([Id]) ON DELETE CASCADE
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'support_ticket_messages')
BEGIN
    CREATE TABLE [support_ticket_messages] (
        [Id] uniqueidentifier NOT NULL,
        [TicketId] uniqueidentifier NOT NULL,
        [SenderId] uniqueidentifier NOT NULL,
        [SenderName] nvarchar(100) NOT NULL,
        [SenderRole] nvarchar(50) NOT NULL,
        [Message] nvarchar(4000) NOT NULL,
        [IsInternal] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_support_ticket_messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_support_ticket_messages_support_tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [support_tickets] ([Id]) ON DELETE CASCADE
    );
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_ticket_history_TicketId' AND object_id = OBJECT_ID('support_ticket_history'))
BEGIN
    CREATE INDEX [IX_support_ticket_history_TicketId] ON [support_ticket_history] ([TicketId]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_ticket_messages_SenderId' AND object_id = OBJECT_ID('support_ticket_messages'))
BEGIN
    CREATE INDEX [IX_support_ticket_messages_SenderId] ON [support_ticket_messages] ([SenderId]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_ticket_messages_TicketId' AND object_id = OBJECT_ID('support_ticket_messages'))
BEGIN
    CREATE INDEX [IX_support_ticket_messages_TicketId] ON [support_ticket_messages] ([TicketId]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_AssigneeId' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_AssigneeId] ON [support_tickets] ([AssigneeId]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_Category' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_Category] ON [support_tickets] ([Category]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_Priority' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_Priority] ON [support_tickets] ([Priority]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_ReporterId' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_ReporterId] ON [support_tickets] ([ReporterId]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_Status' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE INDEX [IX_support_tickets_Status] ON [support_tickets] ([Status]);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_support_tickets_TicketNumber' AND object_id = OBJECT_ID('support_tickets'))
BEGIN
    CREATE UNIQUE INDEX [IX_support_tickets_TicketNumber] ON [support_tickets] ([TicketNumber]);
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "support_ticket_history");

            migrationBuilder.DropTable(
                name: "support_ticket_messages");

            migrationBuilder.DropTable(
                name: "support_tickets");
        }
    }
}
