<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', 'required', 'string', 'in:' . collect(TaskStatus::cases())->pluck('value')->implode(',')],
            'priority' => ['sometimes', 'required', 'string', 'in:' . collect(TaskPriority::cases())->pluck('value')->implode(',')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'due_date' => ['nullable', 'date'],
            'employee_eta' => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
            'dependency_ids' => ['nullable', 'array'],
            'dependency_ids.*' => ['exists:tasks,id'],
            'requires_approval' => ['nullable', 'boolean'],
            'approver_id' => ['nullable', 'required_if:requires_approval,true', 'exists:users,id'],
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
