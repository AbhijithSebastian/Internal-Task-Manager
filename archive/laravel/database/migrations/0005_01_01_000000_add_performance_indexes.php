<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->index('author_id');
            $table->index('approver_id');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->index('project_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index('type');
        });

        Schema::table('integrations', function (Blueprint $table) {
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['author_id']);
            $table->dropIndex(['approver_id']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['project_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['type']);
        });

        Schema::table('integrations', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });
    }
};
