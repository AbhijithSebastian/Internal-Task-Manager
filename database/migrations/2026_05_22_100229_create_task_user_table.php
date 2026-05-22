<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['task_id', 'user_id']);
        });

        // Migrate existing data
        DB::table('tasks')->whereNotNull('assignee_id')->orderBy('id')->chunk(100, function ($tasks) {
            $inserts = [];
            foreach ($tasks as $task) {
                $inserts[] = [
                    'task_id' => $task->id,
                    'user_id' => $task->assignee_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DB::table('task_user')->insert($inserts);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['assignee_id']);
            $table->dropIndex(['assignee_id']);
            $table->dropColumn('assignee_id');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->index('assignee_id');
        });

        // Attempt to restore one assignee per task
        DB::table('task_user')->orderBy('id')->chunk(100, function ($links) {
            foreach ($links as $link) {
                DB::table('tasks')->where('id', $link->task_id)->update(['assignee_id' => $link->user_id]);
            }
        });

        Schema::dropIfExists('task_user');
    }
};
