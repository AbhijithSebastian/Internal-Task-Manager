<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('backlog');
            $table->string('priority')->default('medium');
            $table->date('due_date')->nullable();
            $table->decimal('estimated_hours', 8, 2)->nullable();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('tasks')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('priority');
            $table->index(['project_id', 'status']);
            $table->index('assignee_id');
            $table->index('due_date');
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
