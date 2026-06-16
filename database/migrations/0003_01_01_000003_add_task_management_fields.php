<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('priority');
            $table->text('blocked_reason')->nullable()->after('tags');
        });

        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dependency_id')->constrained('tasks')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['task_id', 'dependency_id']);
            $table->index('dependency_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['tags', 'blocked_reason']);
        });
    }
};
