<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('priority')->default('medium')->after('status');
            $table->foreignId('pm_id')->nullable()->constrained('users')->nullOnDelete()->after('author_id');
            $table->foreignId('lead_id')->nullable()->constrained('users')->nullOnDelete()->after('pm_id');
            $table->string('figma_url')->nullable()->after('end_date');
            $table->string('github_url')->nullable()->after('figma_url');
            $table->string('docs_url')->nullable()->after('github_url');
            $table->string('meeting_url')->nullable()->after('docs_url');

            $table->index('priority');
            $table->index('pm_id');
            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['priority', 'pm_id', 'lead_id', 'figma_url', 'github_url', 'docs_url', 'meeting_url']);
        });
    }
};
