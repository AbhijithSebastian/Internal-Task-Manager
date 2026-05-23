<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;

class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tab' => 'nullable|string|in:task_completion,overdue_analysis,team_productivity,project_health,workload_distribution,weekly_summary,meeting_logs',
            'project_id' => 'nullable|exists:projects,id',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'exists:projects,id',
            'user_id' => 'nullable|exists:users,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'format' => 'nullable|string|in:csv,json,xlsx,html,pdf',
        ];
    }
}
