<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->text('body');
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('task_id');
            $table->index('author_id');
            $table->index('parent_id');
        });

        Schema::create('mentions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('mentionable');
            $table->timestamps();

            $table->index('user_id');
            $table->index(['mentionable_id', 'mentionable_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentions');
        Schema::dropIfExists('comments');
    }
};
