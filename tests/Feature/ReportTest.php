<?php

namespace Tests\Feature;

use App\Enums\Permission;
use Tests\TestCase;

class ReportTest extends TestCase
{
    // ─── Access Restrictions ───

    public function test_super_admin_can_view_reports(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('reports.index', absolute: false));

        $response->assertStatus(200);
    }

    public function test_project_manager_can_view_reports(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('reports.index', absolute: false));

        $response->assertStatus(200);
    }

    public function test_team_lead_cannot_view_reports(): void
    {
        $this->actingAsTeamLead();

        $response = $this->get(route('reports.index', absolute: false));

        $response->assertStatus(403);
    }

    public function test_employee_cannot_view_reports(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('reports.index', absolute: false));

        $response->assertStatus(403);
    }

    // ─── Export Restrictions ───

    public function test_super_admin_can_export_reports(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('reports.export', absolute: false));

        $response->assertStatus(200);
    }

    public function test_project_manager_can_export_reports(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('reports.export', absolute: false));

        $response->assertStatus(200);
    }

    public function test_team_lead_cannot_export_reports(): void
    {
        $this->actingAsTeamLead();

        $response = $this->get(route('reports.export', absolute: false));

        $response->assertStatus(403);
    }

    public function test_employee_cannot_export_reports(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('reports.export', absolute: false));

        $response->assertStatus(403);
    }

    // ─── Filtering ───

    public function test_reports_can_be_filtered_by_project(): void
    {
        $this->actingAsProjectManager();
        $project = $this->createProjectWithMembers();

        $response = $this->get(route('reports.index', ['project_id' => $project->id], absolute: false));

        $response->assertStatus(200);
    }

    public function test_reports_can_be_filtered_by_user(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('reports.index', ['user_id' => $this->employee->id], absolute: false));

        $response->assertStatus(200);
    }

    public function test_reports_can_be_filtered_by_date_range(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('reports.index', [
            'date_from' => '2026-01-01',
            'date_to' => '2026-12-31',
        ], absolute: false));

        $response->assertStatus(200);
    }

    public function test_reports_can_switch_tab(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('reports.index', ['tab' => 'overdue_analysis'], absolute: false));

        $response->assertStatus(200);
    }
}
