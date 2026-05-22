<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('requires_approval')->default(false)->after('parent_id');
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete()->after('requires_approval');
            $table->text('rejection_reason')->nullable()->after('approver_id');
            $table->timestamp('approved_at')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['requires_approval', 'approver_id', 'rejection_reason', 'approved_at']);
        });
    }
};
