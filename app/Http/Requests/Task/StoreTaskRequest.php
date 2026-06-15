<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:10000'],
            'priority' => ['sometimes', 'required', 'string', 'in:' . collect(TaskPriority::cases())->pluck('value')->implode(',')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'due_date' => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'project_id' => ['required', 'exists:projects,id'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
            'dependency_ids' => ['nullable', 'array'],
            'dependency_ids.*' => ['exists:tasks,id'],
            'parent_id' => ['nullable', 'exists:tasks,id'],
            'requires_approval' => ['boolean'],
            'approver_id' => ['nullable', 'required_if:requires_approval,true', 'exists:users,id'],
            'subtasks' => ['nullable', 'array'],
            'subtasks.*.title' => ['required', 'string', 'max:500'],
            'subtasks.*.description' => ['nullable', 'string'],
            'subtasks.*.priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'subtasks.*.due_date' => ['nullable', 'date'],
            'subtasks.*.assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'subtasks.*.estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:999'],
        ];
    }

    public function messages(): array
    {
        return [
            'tags.*.max' => 'Each tag must not exceed 50 characters.',
            'dependency_ids.*.exists' => 'One or more dependencies are invalid.',
        ];
    }
}
