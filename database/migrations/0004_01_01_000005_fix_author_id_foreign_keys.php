<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
