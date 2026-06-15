<template>
    <AppLayout>
        <div class="mx-auto max-w-5xl space-y-6">
            <Breadcrumbs :items="[{ label: 'Projects', route: 'projects.index' }, { label: task.project?.name ?? 'Project', route: 'projects.show', params: { id: task.project?.id } }, { label: task.title }]" :back="{ route: 'tasks.index' }" />

            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-3">
                        <h2 class="text-2xl font-bold text-text-primary">{{ task.title }}</h2>
                        <Badge :variant="statusBadge(task.status)">{{ task.status_label }}</Badge>
                    </div>
                    <div v-if="task.tags?.length" class="mt-1 flex gap-1.5">
                        <span v-for="tag in task.tags" :key="tag" class="inline-flex items-center rounded-full bg-brand-primary-50 px-2 py-0.5 text-xs font-medium text-brand-primary-700">{{ tag }}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <Link :href="route('tasks.edit', task.id)" class="btn-secondary btn-sm">Edit</Link>
                    <button v-if="can('tasks.delete')" class="btn-danger btn-sm" @click="confirmDeleteTask = true">Delete</button>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div class="md:col-span-2 space-y-6">
                    <!-- Assignee Action Panel -->
                    <div v-if="isAssignee" class="card border-brand-primary-100 bg-brand-primary-50/10 shadow-card">
                        <div class="card-header border-b border-brand-primary-100/50 bg-brand-primary-50/20 px-4 py-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="flex h-2 w-2 rounded-full bg-brand-primary-500 animate-pulse"></span>
                                <h3 class="text-sm font-semibold text-brand-primary-700">Assignee Action Panel</h3>
                            </div>
                            <span class="text-xs text-brand-primary-500 font-medium">Quick actions for you as the assignee</span>
                        </div>
                        <div class="card-body p-4 space-y-4">
                            <!-- Row 1: Status Transitions & Submit for Review -->
                            <div class="flex flex-wrap items-center gap-3">
                                <span class="text-xs font-medium text-text-secondary">Transition Status:</span>

                                <button
                                    v-if="task.status === 'todo'"
                                    class="btn-primary btn-sm flex items-center gap-1.5"
                                    @click="quickTransition('in_progress')"
                                >
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Start Work (In Progress)
                                </button>

                                <button
                                    v-if="task.status === 'in_progress'"
                                    class="btn-secondary btn-sm flex items-center gap-1.5 text-danger border-danger/20 hover:bg-danger-50"
                                    @click="toggleEmployeeBlockForm"
                                >
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Block Task
                                </button>

                                <button
                                    v-if="task.status === 'blocked'"
                                    class="btn-secondary btn-sm flex items-center gap-1.5 text-success border-success/20 hover:bg-success-50"
                                    @click="unblockTask"
                                >
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Resolve Block (Unblock)
                                </button>

                                <button
                                    v-if="canSubmitForReview"
                                    class="btn-primary btn-sm flex items-center gap-1.5 bg-warning text-white hover:bg-warning/80"
                                    @click="submitForReview"
                                >
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-4 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    Submit for Review
                                </button>

                                <button
                                    v-if="task.status === 'in_progress' && !task.requires_approval"
                                    class="btn-primary btn-sm flex items-center gap-1.5 bg-success text-white hover:bg-success/80"
                                    @click="quickTransition('done')"
                                >
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                    Complete Task
                                </button>

                                <span v-if="task.status === 'in_review' || task.status === 'approved' || task.status === 'done' || task.status === 'cancelled'" class="text-xs text-text-secondary italic">
                                    No immediate transitions available for status: {{ task.status_label }}
                                </span>
                            </div>

                            <!-- Blocker Reason Input (inline conditional) -->
                            <div v-if="showEmployeeBlockForm" class="bg-danger-50 border border-danger/20 rounded-card p-3 space-y-2">
                                <label for="employee_block_reason" class="block text-xs font-semibold text-danger">Blocker Reason</label>
                                <textarea
                                    id="employee_block_reason"
                                    v-model="employeeBlockReason"
                                    rows="2"
                                    class="input text-sm"
                                    placeholder="What is blocking this task?"
                                ></textarea>
                                <div class="flex justify-end gap-2">
                                    <button class="btn-secondary btn-sm text-xs" @click="showEmployeeBlockForm = false">Cancel</button>
                                    <button class="btn-danger btn-sm text-xs" :disabled="!employeeBlockReason.trim()" @click="submitEmployeeBlock">Block Task</button>
                                </div>
                            </div>

                            <!-- Row 2: ETA update & Progress Update -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-3">
                                <!-- Left Side of Row 2: ETA update -->
                                <div>
                                    <form @submit.prevent="submitEmployeeEta" class="space-y-2">
                                        <label for="employee_eta_field" class="block text-xs font-medium text-text-primary">Estimated Completion (ETA)</label>
                                        <div class="flex gap-2">
                                            <input
                                                id="employee_eta_field"
                                                v-model="employeeEtaForm.employee_eta"
                                                type="date"
                                                class="input text-sm py-1.5 flex-1"
                                            >
                                            <button
                                                type="submit"
                                                class="btn-secondary btn-sm text-xs py-1.5"
                                                :disabled="employeeEtaUpdating || employeeEtaForm.employee_eta === (task.employee_eta ? dayjs(task.employee_eta).format('YYYY-MM-DD') : '')"
                                            >
                                                <svg v-if="employeeEtaUpdating" class="animate-spin -ml-0.5 mr-1 h-3 w-3 text-text-secondary inline" viewBox="0 0 24 24" fill="none">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Save ETA
                                            </button>
                                        </div>
                                        <p class="text-[11px] text-text-secondary">Updates the task assignee's estimated delivery date without modifying the project's official deadline.</p>
                                    </form>
                                </div>

                                <!-- Right Side of Row 2: Progress Notes -->
                                <div>
                                    <div class="space-y-2">
                                        <label for="progress_note_field" class="block text-xs font-medium text-text-primary">Post Progress Update</label>
                                        <div class="flex gap-2">
                                            <input
                                                id="progress_note_field"
                                                v-model="progressNote"
                                                type="text"
                                                class="input text-sm py-1.5 flex-1"
                                                placeholder="What progress have you made today?"
                                            >
                                            <button
                                                class="btn-secondary btn-sm text-xs py-1.5 shrink-0"
                                                :disabled="progressNoteProcessing || !progressNote.trim()"
                                                @click="submitProgressNote"
                                            >
                                                <svg v-if="progressNoteProcessing" class="animate-spin -ml-0.5 mr-1 h-3 w-3 text-text-secondary inline" viewBox="0 0 24 24" fill="none">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Post Note
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header"><h3 class="text-base font-semibold">Description</h3></div>
                        <div class="card-body">
                            <p class="text-sm text-text-primary whitespace-pre-wrap">{{ task.description || 'No description provided.' }}</p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold">Dependencies</h3>
                            <div class="flex gap-2">
                                <select v-model="dependencyForm.dependency_id" class="input text-xs py-1 max-w-[200px]">
                                    <option :value="null" disabled>Add dependency...</option>
                                    <option v-for="t in availableDependencies" :key="t.id" :value="t.id">{{ t.title }}</option>
                                </select>
                                <button class="btn-secondary btn-sm text-xs" :disabled="!dependencyForm.dependency_id" @click="addDependency">Add</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div v-if="task.dependencies?.length === 0" class="text-sm text-text-secondary">No dependencies.</div>
                            <ul v-else class="divide-y divide-border">
                                <li v-for="dep in task.dependencies" :key="dep.id" class="flex items-center justify-between py-2">
                                    <div class="flex items-center gap-2">
                                        <Link :href="route('tasks.show', dep.id)" class="text-sm font-medium text-text-primary hover:text-brand-primary-600">{{ dep.title }}</Link>
                                        <Badge :variant="statusBadge(dep.status)">{{ dep.status_label ?? dep.status }}</Badge>
                                    </div>
                                    <button class="text-xs text-danger hover:text-danger" @click="removeDependency(dep)">Remove</button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold">Subtasks ({{ task.completed_subtask_count }}/{{ task.subtask_count }})</h3>
                            <button class="btn-secondary btn-sm" @click="showSubtaskForm = !showSubtaskForm">
                                {{ showSubtaskForm ? 'Cancel' : 'Add Subtask' }}
                            </button>
                        </div>
                        <div class="card-body">
                            <div v-if="task.subtask_count > 0" class="mb-4">
                                <div class="flex items-center justify-between text-xs text-text-secondary mb-1">
                                    <span>{{ task.subtask_completion_rate }}% complete</span>
                                    <span v-if="task.subtask_completion_rate === 100" class="text-success font-medium">All complete</span>
                                </div>
                                <div class="h-2 w-full rounded-full bg-page">
                                    <div class="h-2 rounded-full bg-brand-primary-500 transition-all duration-300" :style="{ width: task.subtask_completion_rate + '%' }"></div>
                                </div>
                            </div>
                            <div v-if="task.subtasks.length === 0 && !showSubtaskForm" class="text-sm text-text-secondary">No subtasks.</div>
                            <ul v-else class="divide-y divide-border">
                                <li v-for="subtask in task.subtasks" :key="subtask.id" class="py-3">
                                    <div class="flex items-start gap-3">
                                        <input type="checkbox" :checked="subtask.status === 'done'" class="mt-0.5 rounded border-border text-brand-primary-500 shrink-0" :aria-label="(subtask.status === 'done' ? 'Mark subtask incomplete' : 'Mark subtask complete') + ': ' + subtask.title" @change="toggleSubtaskStatus(subtask)">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2">
                                                <template v-if="editingSubtaskId === subtask.id">
                                                    <input v-model="editingSubtaskTitle" type="text" class="input text-sm flex-1 min-w-0" @keydown.enter="saveSubtaskTitle(subtask)" @keydown.escape="cancelSubtaskEdit" @click.stop>
                                                    <button class="text-xs text-brand-primary-500 hover:text-brand-primary-600 shrink-0" @click="saveSubtaskTitle(subtask)">Save</button>
                                                    <button class="text-xs text-text-secondary hover:text-gray-600 shrink-0" @click="cancelSubtaskEdit">Cancel</button>
                                                </template>
                                                <template v-else>
                                                    <button class="text-sm font-medium truncate text-left hover:text-brand-primary-600" :class="subtask.status === 'done' ? 'line-through text-text-secondary' : 'text-text-primary'" @click="startSubtaskEdit(subtask)">{{ subtask.title }}</button>
                                                </template>
                                                <Badge :variant="statusBadge(subtask.status)" class="text-[10px]">{{ subtask.status_label ?? subtask.status }}</Badge>
                                                <Badge :variant="priorityBadge(subtask.priority)" class="text-[10px] capitalize">{{ subtask.priority }}</Badge>
                                            </div>
                                            <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                                                <span v-if="subtask.due_date">
                                                    Due {{ dayjs(subtask.due_date).format('MMM D, YYYY') }}
                                                </span>
                                                <span v-if="subtask.completed_at" class="text-success">
                                                    Completed {{ dayjs(subtask.completed_at).format('MMM D') }}
                                                </span>
                                                <span v-if="subtask.assignees?.length" class="flex items-center gap-1">
                                                    <span>{{ subtask.assignees.map((a: any) => a.name).join(', ') }}</span>
                                                </span>
                                                <span v-else class="italic">Unassigned</span>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            <select v-model="subtask.assignee_id" class="input text-xs py-1 max-w-[110px]" @change="changeSubtaskAssignee(subtask)">
                                                <option :value="null">Unassign</option>
                                                <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                            </select>
                                            <button class="text-xs text-danger hover:text-danger p-1" @click="confirmDeleteSubtask(subtask)" aria-label="Delete subtask">
                                                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            <form v-if="showSubtaskForm" @submit.prevent="addSubtask" class="mt-4 space-y-3 border-t border-border pt-4">
                                <input v-model="subtaskForm.title" type="text" class="input" placeholder="Subtask title">
                                <textarea v-model="subtaskForm.description" rows="2" class="input w-full resize-none text-sm" placeholder="Optional description..."></textarea>
                                <div class="flex gap-2 flex-wrap">
                                    <select v-model="subtaskForm.priority" class="input flex-1 min-w-[100px]">
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <input v-model="subtaskForm.due_date" type="date" class="input flex-1 min-w-[130px]">
                                    <select v-model="subtaskForm.assignee_id" class="input flex-1 min-w-[120px]">
                                        <option :value="null">Unassigned</option>
                                        <option v-for="m in projectMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
                                    </select>
                                </div>
                                <div class="flex justify-end">
                                    <button type="submit" class="btn-primary btn-sm">Add Subtask</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <Modal :open="subtaskDeleteModal.open" @close="subtaskDeleteModal.open = false">
                        <template #title>Delete Subtask</template>
                        <p class="text-sm text-text-secondary">Delete <strong>{{ subtaskDeleteModal.subtask?.title }}</strong>? This cannot be undone.</p>
                        <div class="mt-6 flex justify-end gap-3">
                            <button class="btn-secondary btn-sm" @click="subtaskDeleteModal.open = false">Cancel</button>
                            <button class="btn-danger btn-sm" :disabled="subtaskDeleteModal.processing" @click="deleteSubtask">
                                <svg v-if="subtaskDeleteModal.processing" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" viewBox="0 0 24 24" fill="none">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </Modal>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-base font-semibold">Attachments</h3>
                        </div>
                        <div class="card-body space-y-3">
                            <FileUpload :upload-route="route('tasks.attachments.upload', task.id)" @success="refreshPage" />
                            <FileList
                                :files="task.attachments ?? []"
                                :can-delete="true"
                                :delete-route="(file: any) => route('tasks.attachments.delete', { task: task.id, media: file.id })"
                                @deleted="refreshPage"
                            />
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header flex items-center justify-between">
                            <h3 class="text-base font-semibold">Comments</h3>
                            <span class="text-xs text-text-secondary">{{ comments.total ?? 0 }} comments</span>
                        </div>
                        <div class="card-body space-y-4">
                            <div v-if="comments.data?.length === 0" class="text-sm text-text-secondary">No comments yet.</div>
                            <template v-for="comment in comments.data" :key="comment.id">
                                <div class="flex gap-3">
                                    <img :src="comment.author?.avatar" alt="" class="h-8 w-8 rounded-full shrink-0">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-medium text-text-primary">{{ comment.author?.name }}</span>
                                            <span class="text-xs text-text-secondary">{{ dayjs(comment.created_at).fromNow() }}</span>
                                            <template v-if="comment.author_id === $page.props.auth.user.id">
                                                <button class="text-xs text-text-secondary hover:text-gray-600" @click="startCommentEdit(comment)">Edit</button>
                                                <button class="text-xs text-danger hover:text-danger" @click="confirmDeleteComment(comment)">Delete</button>
                                            </template>
                                        </div>

                                        <template v-if="editingCommentId === comment.id">
                                            <textarea v-model="editingCommentBody" class="input mt-1 text-sm" rows="2" @keydown.enter.ctrl="saveComment(comment)"></textarea>
                                            <div class="mt-1 flex gap-2">
                                                <button class="text-xs text-brand-primary-500 hover:text-brand-primary-600" @click="saveComment(comment)">Save</button>
                                                <button class="text-xs text-text-secondary hover:text-gray-600" @click="cancelCommentEdit">Cancel</button>
                                            </div>
                                        </template>
                                        <template v-else>
                                            <p class="mt-1 text-sm text-text-primary" v-html="renderMentions(comment.body)"></p>
                                        </template>

                                        <div class="mt-1 flex items-center gap-3">
                                            <button class="text-xs text-text-secondary hover:text-brand-primary-500" @click="toggleReplyForm(comment)">
                                                {{ replyFormParentId === comment.id ? 'Cancel' : 'Reply' }}
                                            </button>
                                            <span v-if="comment.replies_count > 0" class="text-xs text-text-secondary">
                                                {{ comment.replies_count }} {{ comment.replies_count === 1 ? 'reply' : 'replies' }}
                                            </span>
                                        </div>

                                        <form v-if="replyFormParentId === comment.id" @submit.prevent="addReply(comment)" class="mt-2 flex gap-2">
                                            <input v-model="replyForm.body" type="text" class="input flex-1 text-sm" placeholder="Write a reply... (Enter to send)" @keydown.enter.prevent="addReply(comment)">
                                            <button type="submit" :disabled="!replyForm.body.trim()" class="btn-primary btn-sm text-xs">Send</button>
                                        </form>

                                        <div v-if="comment.replies?.length" class="mt-2 space-y-2 border-l-2 border-border pl-3">
                                            <div v-for="reply in comment.replies" :key="reply.id" class="flex gap-2">
                                                <img :src="reply.author?.avatar" alt="" class="h-6 w-6 rounded-full shrink-0">
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xs font-medium text-text-primary">{{ reply.author?.name }}</span>
                                                        <span class="text-[10px] text-text-secondary">{{ dayjs(reply.created_at).fromNow() }}</span>
                                                        <template v-if="reply.author_id === $page.props.auth.user.id">
                                                            <button class="text-[10px] text-text-secondary hover:text-gray-600" @click="startReplyEdit(reply)">Edit</button>
                                                            <button class="text-[10px] text-danger hover:text-danger" @click="confirmDeleteComment(reply)">Delete</button>
                                                        </template>
                                                    </div>
                                                    <template v-if="editingReplyId === reply.id">
                                                        <input v-model="editingReplyBody" type="text" class="input mt-0.5 text-xs w-full" @keydown.enter="saveReply(reply)" @keydown.escape="cancelReplyEdit">
                                                        <div class="mt-0.5 flex gap-2">
                                                            <button class="text-[10px] text-brand-primary-500" @click="saveReply(reply)">Save</button>
                                                            <button class="text-[10px] text-text-secondary" @click="cancelReplyEdit">Cancel</button>
                                                        </div>
                                                    </template>
                                                    <template v-else>
                                                        <p class="text-xs text-text-primary" v-html="renderMentions(reply.body)"></p>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <Pagination :pagination="comments" class="mt-4" />
                            <form @submit.prevent="addComment" class="flex gap-2 pt-2 border-t border-border">
                                <div class="relative flex-1">
                                    <input ref="commentInputRef" v-model="commentForm.body" type="text" class="input w-full" placeholder="Add a comment... (@name to mention, Ctrl+Enter to send)" @keydown.enter.ctrl="addComment" @keydown="handleCommentKeydown" @input="handleCommentInput">
                                    <MentionAutocomplete
                                        ref="mentionAutocompleteRef"
                                        :members="projectMembers"
                                        :query="mentionQuery"
                                        :input-element="commentInputRef"
                                        :visible="mentionVisible"
                                        @select="selectMention"
                                    />
                                </div>
                                <button type="submit" :disabled="commentForm.processing || !commentForm.body.trim()" class="btn-primary btn-sm">
                                    <svg v-if="commentForm.processing" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>

                    <Modal :open="commentDeleteModal.open" @close="commentDeleteModal.open = false">
                        <template #title>Delete Comment</template>
                        <p class="text-sm text-text-secondary">Delete this comment? This cannot be undone.</p>
                        <div class="mt-6 flex justify-end gap-3">
                            <button class="btn-secondary btn-sm" @click="commentDeleteModal.open = false">Cancel</button>
                            <button class="btn-danger btn-sm" :disabled="commentDeleteModal.processing" @click="deleteComment">Delete</button>
                        </div>
                    </Modal>
                </div>

                <div class="space-y-6">
                    <div class="card">
                        <div class="card-header"><h3 class="text-base font-semibold">Status</h3></div>
                        <div class="card-body space-y-3">
                            <div class="relative">
                                <select v-model="task.status" class="input" @change="updateStatus">
                                    <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                                </select>
                                <div v-if="statusUpdating" class="absolute right-2 top-1/2 -translate-y-1/2">
                                    <svg class="h-4 w-4 animate-spin text-brand-primary-500" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            </div>
                            <div v-if="task.status === 'blocked' && task.blocked_reason" class="rounded-card bg-danger-50 p-3 text-sm text-danger">
                                <p class="font-medium">Blocked reason:</p>
                                <p>{{ task.blocked_reason }}</p>
                            </div>
                            <div v-if="task.status !== 'blocked'">
                                <button class="btn-sm w-full text-sm text-danger border border-danger/30 rounded-card py-1.5 hover:bg-danger-50" @click="showBlockForm = !showBlockForm">Block Task</button>
                                <div v-if="showBlockForm" class="mt-2 space-y-2">
                                    <textarea v-model="blockForm.reason" rows="2" class="input text-sm" placeholder="Why is this blocked?"></textarea>
                                    <button class="btn-danger btn-sm w-full" :disabled="!blockForm.reason" @click="blockTask">Block</button>
                                </div>
                            </div>
                            <button v-if="task.status === 'blocked'" class="btn-sm w-full text-sm text-success border border-success/30 rounded-card py-1.5 hover:bg-success-50" @click="unblockTask">Unblock</button>
                            <div class="border-t border-border pt-3 mt-3">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-text-secondary">Due</span>
                                    <span class="font-medium text-text-primary">{{ task.due_date || 'Not set' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header"><h3 class="text-sm font-semibold text-text-primary uppercase tracking-wider">Assignees</h3></div>
                        <div class="card-body space-y-4">
                            <!-- Display list of current assignees -->
                            <div class="space-y-2">
                                <div v-if="task.assignees.length === 0" class="text-sm text-text-secondary italic">No assignees linked.</div>
                                <div v-else class="flex flex-col gap-2">
                                    <div v-for="a in task.assignees" :key="a.id" class="flex items-center gap-2.5 rounded-card bg-page border border-border px-3 py-2 text-sm text-text-primary">
                                        <div class="h-6 w-6 rounded-full bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center font-semibold text-xs uppercase">
                                            {{ a.name.substring(0, 2) }}
                                        </div>
                                        <span class="font-medium flex-1 text-text-primary">{{ a.name }}</span>
                                        <button v-if="can('tasks.assign')" type="button" class="text-xs text-danger hover:text-danger font-medium px-2 py-1" @click="removeAssignee(a.id)">Remove</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Dropdown for adding assignees -->
                            <div v-if="can('tasks.assign')" class="relative pt-2" ref="assigneeContainer">
                                <button
                                    type="button"
                                    class="input w-full text-left text-sm flex items-center justify-between min-h-[38px] py-1.5 px-3 bg-white"
                                    @click="isAssigneeDropdownOpen = !isAssigneeDropdownOpen"
                                >
                                    <span class="text-text-secondary font-medium">Add Assignee...</span>
                                    <svg class="h-4 w-4 text-text-secondary ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <!-- Dropdown Menu -->
                                <div
                                    v-if="isAssigneeDropdownOpen"
                                    class="absolute z-30 mt-1 w-full rounded-md bg-white shadow-dropdown ring-1 ring-black/5 focus:outline-none max-h-60 overflow-y-auto p-1 space-y-1"
                                >
                                    <div v-if="unassignedMembers.length === 0" class="text-xs text-text-secondary p-2 text-center">
                                        All project members assigned
                                    </div>
                                    <button
                                        v-for="m in unassignedMembers"
                                        :key="m.id"
                                        type="button"
                                        class="w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between hover:bg-page focus:bg-page focus:outline-none"
                                        @click="addAssignee(m.id)"
                                    >
                                        <span class="font-medium text-text-primary">
                                            {{ m.name }}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="task.requires_approval" class="card" :class="task.approval_status === 'pending_review' ? 'ring-2 ring-warning' : ''">
                        <div class="card-header"><h3 class="text-base font-semibold">Approval</h3></div>
                        <div class="card-body space-y-3">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-text-secondary">Status</span>
                                <Badge :variant="approvalBadge(task.approval_status)">{{ approvalLabel(task.approval_status) }}</Badge>
                            </div>
                            <div v-if="task.approver" class="flex items-center gap-2 text-sm">
                                <img :src="task.approver.avatar" alt="" class="h-5 w-5 rounded-full">
                                <span class="text-text-secondary">Approver:</span>
                                <span class="text-text-primary font-medium">{{ task.approver.name }}</span>
                            </div>
                            <div v-if="task.rejection_reason" class="rounded-card bg-danger-50 p-3 text-sm text-danger">
                                <p class="font-medium">Rejection reason:</p>
                                <p>{{ task.rejection_reason }}</p>
                            </div>

                            <template v-if="task.approval_status === 'not_submitted' && canSubmitForReview">
                                <button class="btn-primary btn-sm w-full" @click="submitForReview">Submit for Review</button>
                            </template>

                            <template v-if="task.approval_status === 'pending_review' && canApprove">
                                <button class="btn-primary btn-sm w-full" @click="approveTask">Approve</button>
                                <button class="btn-sm w-full text-sm text-danger border border-danger/30 rounded-card py-1.5 hover:bg-danger-50" @click="showRejectForm = !showRejectForm">
                                    Reject
                                </button>
                                <div v-if="showRejectForm" class="space-y-2">
                                    <textarea v-model="rejectForm.reason" rows="2" class="input text-sm" placeholder="Reason for rejection..."></textarea>
                                    <button class="btn-danger btn-sm w-full" :disabled="!rejectForm.reason" @click="rejectTask">Reject</button>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header"><h3 class="text-base font-semibold">Details</h3></div>
                        <div class="card-body space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Priority</span>
                                <Badge :variant="priorityBadge(task.priority)">{{ task.priority }}</Badge>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Due date</span>
                                <span class="text-text-primary">{{ task.due_date || '—' }}</span>
                            </div>
                            <div v-if="task.employee_eta" class="flex justify-between">
                                <span class="text-text-secondary">Employee ETA</span>
                                <span class="text-text-primary font-medium text-brand-primary-700">{{ dayjs(task.employee_eta).format('MMM D, YYYY') }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Est. hours</span>
                                <span class="text-text-primary">{{ task.estimated_hours ?? '—' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Author</span>
                                <span class="text-text-primary">{{ task.author?.name }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Created</span>
                                <span class="text-text-primary">{{ dayjs(task.created_at).format('MMM D, YYYY') }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Subtasks</span>
                                <span class="text-text-primary">{{ task.completed_subtask_count }}/{{ task.subtask_count }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-secondary">Dependents</span>
                                <span class="text-text-primary">{{ task.dependents?.length ?? 0 }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        <ConfirmDialog
            :open="confirmDeleteTask"
            :processing="confirmDeleteTaskProcessing"
            title="Delete Task"
            message="Are you sure you want to delete this task? This action cannot be undone."
            variant="danger"
            confirm-text="Delete"
            @confirm="doDeleteTask"
            @close="confirmDeleteTask = false"
        />
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { usePermissions } from '@/Composables/usePermissions'
import AppLayout from '@/Layouts/AppLayout.vue'
import Badge from '@/Components/Badge.vue'
import FileList from '@/Components/FileList.vue'
import FileUpload from '@/Components/FileUpload.vue'
import Modal from '@/Components/Modal.vue'
import Pagination from '@/Components/Pagination.vue'
import MentionAutocomplete from '@/Components/MentionAutocomplete.vue'
import Breadcrumbs from '@/Components/Breadcrumbs.vue'
import ConfirmDialog from '@/Components/ConfirmDialog.vue'
import DOMPurify from 'dompurify'
import { route } from 'ziggy-js'

dayjs.extend(relativeTime)

const { can } = usePermissions()
const page = usePage()

const props = defineProps<{ task: any; comments: any; project_members: any; available_dependencies: any }>()

const projectMembers = props.project_members
const availableDependencies = props.available_dependencies

const isAssignee = computed(() => props.task.assignees?.some((a: any) => a.id === page.props.auth.user?.id))

const isAssigneeDropdownOpen = ref(false)
const assigneeContainer = ref<HTMLElement | null>(null)

const unassignedMembers = computed(() => {
    return projectMembers.filter((m: any) => !props.task.assignees?.some((a: any) => a.id === m.id))
})

function addAssignee(id: number) {
    isAssigneeDropdownOpen.value = false
    const currentIds = props.task.assignees?.map((a: any) => a.id) ?? []
    const newIds = [...currentIds, id]
    router.post(route('tasks.assign', props.task.id), { assignee_ids: newIds }, { preserveScroll: true })
}

function removeAssignee(id: number) {
    const currentIds = props.task.assignees?.map((a: any) => a.id) ?? []
    const newIds = currentIds.filter((cid: number) => cid !== id)
    router.post(route('tasks.assign', props.task.id), { assignee_ids: newIds }, { preserveScroll: true })
}

function handleClickOutside(event: MouseEvent) {
    if (assigneeContainer.value && !assigneeContainer.value.contains(event.target as Node)) {
        isAssigneeDropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
const showEmployeeBlockForm = ref(false)
const employeeBlockReason = ref('')
const employeeEtaUpdating = ref(false)
const employeeEtaForm = useForm({
    employee_eta: props.task.employee_eta ? dayjs(props.task.employee_eta).format('YYYY-MM-DD') : ''
})
const progressNote = ref('')
const progressNoteProcessing = ref(false)

watch(() => props.task.employee_eta, (newEta) => {
    employeeEtaForm.employee_eta = newEta ? dayjs(newEta).format('YYYY-MM-DD') : ''
})

const commentInputRef = ref<HTMLInputElement | null>(null)
const mentionAutocompleteRef = ref<InstanceType<typeof MentionAutocomplete> | null>(null)
const mentionVisible = ref(false)
const mentionQuery = ref('')
const mentionStartPos = ref(-1)

function handleCommentInput() {
    const body = commentForm.body
    if (!body) {
        mentionVisible.value = false
        return
    }
    const cursorPos = commentInputRef.value?.selectionStart ?? body.length
    const textBeforeCursor = body.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
        const query = textBeforeCursor.slice(atIndex + 1)
        if (!query.includes(' ')) {
            mentionQuery.value = query.toLowerCase()
            mentionStartPos.value = atIndex
            mentionVisible.value = true
            return
        }
    }
    mentionVisible.value = false
}

function handleCommentKeydown(e: KeyboardEvent) {
    if (!mentionVisible.value) return

    if (e.key === 'ArrowDown') {
        e.preventDefault()
        mentionAutocompleteRef.value?.nextResult()
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        mentionAutocompleteRef.value?.prevResult()
    } else if (e.key === 'Enter' && !e.ctrlKey) {
        const user = mentionAutocompleteRef.value?.selectHighlighted()
        if (user) {
            e.preventDefault()
            selectMention(user)
        }
    } else if (e.key === 'Escape') {
        mentionVisible.value = false
    }
}

function selectMention(user: { id: number; name: string }) {
    const atIndex = mentionStartPos.value
    if (atIndex === -1) return

    const before = commentForm.body.slice(0, atIndex)
    const after = commentForm.body.slice(commentInputRef.value?.selectionStart ?? commentForm.body.length)
    commentForm.body = `${before}@${user.name} ${after}`
    mentionVisible.value = false

    nextTick(() => {
        const newCursorPos = atIndex + user.name.length + 2
        commentInputRef.value?.setSelectionRange(newCursorPos, newCursorPos)
        commentInputRef.value?.focus()
    })
}

const statuses = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'blocked', label: 'Blocked' },
]

const statusUpdating = ref(false)
const confirmDeleteTask = ref(false)
const confirmDeleteTaskProcessing = ref(false)
const showSubtaskForm = ref(false)
const showBlockForm = ref(false)
const showRejectForm = ref(false)
const subtaskDeleteModal = reactive({ open: false, processing: false, subtask: null as any })
const commentDeleteModal = reactive({ open: false, processing: false, comment: null as any })
const editingSubtaskId = ref<number | null>(null)
const editingSubtaskTitle = ref('')
const editingCommentId = ref<number | null>(null)
const editingCommentBody = ref('')
const editingReplyId = ref<number | null>(null)
const editingReplyBody = ref('')
const replyFormParentId = ref<number | null>(null)

const subtaskForm = useForm({ title: '', description: '', priority: 'medium', due_date: '', assignee_id: null as number | null })
const commentForm = useForm({ body: '' })
const replyForm = useForm({ body: '' })
const assignForm = useForm({ assignee_id: '' })
const dependencyForm = useForm({ dependency_id: null as number | null })
const blockForm = reactive({ reason: '' })
const rejectForm = reactive({ reason: '' })

const canSubmitForReview = computed(() => {
    return isAssignee.value
        && can('tasks.submit-approval')
        && props.task.status === 'in_progress'
})

const canApprove = computed(() => {
    return can('tasks.approve')
        && (props.task.approver_id === page.props.auth.user.id || can('projects.manage-members'))
        && props.task.status === 'in_review'
})

function approvalLabel(status: string | null): string {
    const map: Record<string, string> = {
        pending_review: 'Pending Review',
        approved: 'Approved',
        not_submitted: 'Not Submitted',
    }
    return status ? (map[status] ?? status) : '—'
}

function approvalBadge(status: string | null): string {
    const map: Record<string, string> = {
        pending_review: 'warning',
        approved: 'success',
        not_submitted: 'neutral',
    }
    return status ? (map[status] ?? 'neutral') : 'neutral'
}

function statusBadge(status: string): string {
    const map: Record<string, string> = {
        backlog: 'neutral', todo: 'info', in_progress: 'warning',
        in_review: 'warning', approved: 'success', done: 'success',
        cancelled: 'danger', blocked: 'danger',
    }
    return map[status] ?? 'neutral'
}

function priorityBadge(priority: string): string {
    const map: Record<string, string> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }
    return map[priority] ?? 'neutral'
}

function updateStatus() {
    statusUpdating.value = true
    router.patch(route('tasks.status', props.task.id), { status: props.task.status }, {
        preserveScroll: true,
        onFinish: () => { statusUpdating.value = false },
    })
}

function assignTask() {
    router.post(route('tasks.assign', props.task.id), assignForm.data(), { preserveScroll: true })
}

function addDependency() {
    if (!dependencyForm.dependency_id) return
    router.post(route('tasks.dependencies.add', props.task.id), dependencyForm.data(), {
        preserveScroll: true,
        onSuccess: () => { dependencyForm.dependency_id = null },
    })
}

function removeDependency(dep: any) {
    router.delete(route('tasks.dependencies.remove', { task: props.task.id, dependency: dep.id }), { preserveScroll: true })
}

function submitForReview() {
    router.post(route('tasks.submit-review', props.task.id), {}, { preserveScroll: true })
}

function approveTask() {
    router.post(route('tasks.approve', props.task.id), {}, { preserveScroll: true })
}

function rejectTask() {
    if (!rejectForm.reason) return
    router.post(route('tasks.reject', props.task.id), { rejection_reason: rejectForm.reason }, {
        preserveScroll: true,
        onSuccess: () => { showRejectForm.value = false; rejectForm.reason = '' },
    })
}

function blockTask() {
    if (!blockForm.reason) return
    router.post(route('tasks.block', props.task.id), { blocked_reason: blockForm.reason }, {
        preserveScroll: true,
        onSuccess: () => { showBlockForm.value = false; blockForm.reason = '' },
    })
}

function unblockTask() {
    router.post(route('tasks.unblock', props.task.id), {}, { preserveScroll: true })
}

function addComment() {
    commentForm.post(route('comments.store', props.task.id), {
        preserveScroll: true,
        onSuccess: () => { commentForm.reset() },
    })
}

function addSubtask() {
    subtaskForm.post(route('tasks.subtasks.store', props.task.id), {
        preserveScroll: true,
        onSuccess: () => {
            subtaskForm.reset()
            subtaskForm.priority = 'medium'
            subtaskForm.due_date = ''
            subtaskForm.description = ''
            showSubtaskForm.value = false
        },
    })
}

function toggleSubtaskStatus(subtask: any) {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done'
    router.patch(route('tasks.status', subtask.id), { status: newStatus }, { preserveScroll: true })
}

function startSubtaskEdit(subtask: any) {
    editingSubtaskId.value = subtask.id
    editingSubtaskTitle.value = subtask.title
}

function cancelSubtaskEdit() {
    editingSubtaskId.value = null
    editingSubtaskTitle.value = ''
}

function saveSubtaskTitle(subtask: any) {
    if (!editingSubtaskTitle.value.trim() || editingSubtaskTitle.value === subtask.title) {
        cancelSubtaskEdit()
        return
    }
    router.put(route('tasks.subtasks.update', { task: props.task.id, subtask: subtask.id }), {
        title: editingSubtaskTitle.value,
    }, {
        preserveScroll: true,
        onSuccess: () => cancelSubtaskEdit(),
    })
}

function changeSubtaskAssignee(subtask: any) {
    router.put(route('tasks.subtasks.update', { task: props.task.id, subtask: subtask.id }), {
        assignee_id: subtask.assignee_id,
    }, { preserveScroll: true })
}

function confirmDeleteSubtask(subtask: any) {
    subtaskDeleteModal.subtask = subtask
    subtaskDeleteModal.open = true
}

function deleteSubtask() {
    if (!subtaskDeleteModal.subtask) return
    subtaskDeleteModal.processing = true
    router.delete(route('tasks.subtasks.destroy', { task: props.task.id, subtask: subtaskDeleteModal.subtask.id }), {
        preserveScroll: true,
        onFinish: () => {
            subtaskDeleteModal.open = false
            subtaskDeleteModal.processing = false
            subtaskDeleteModal.subtask = null
        },
    })
}

function startCommentEdit(comment: any) {
    editingCommentId.value = comment.id
    editingCommentBody.value = comment.body
}

function cancelCommentEdit() {
    editingCommentId.value = null
    editingCommentBody.value = ''
}

function saveComment(comment: any) {
    if (!editingCommentBody.value.trim() || editingCommentBody.value === comment.body) {
        cancelCommentEdit()
        return
    }
    router.put(route('comments.update', comment.id), {
        body: editingCommentBody.value,
    }, {
        preserveScroll: true,
        onSuccess: () => cancelCommentEdit(),
    })
}

function confirmDeleteComment(comment: any) {
    commentDeleteModal.comment = comment
    commentDeleteModal.open = true
}

function deleteComment() {
    if (!commentDeleteModal.comment) return
    commentDeleteModal.processing = true
    router.delete(route('comments.destroy', commentDeleteModal.comment.id), {
        preserveScroll: true,
        onFinish: () => {
            commentDeleteModal.open = false
            commentDeleteModal.processing = false
            commentDeleteModal.comment = null
        },
    })
}

function toggleReplyForm(comment: any) {
    if (replyFormParentId.value === comment.id) {
        replyFormParentId.value = null
    } else {
        replyFormParentId.value = comment.id
        replyForm.body = ''
    }
}

function addReply(comment: any) {
    if (!replyForm.body.trim()) return
    router.post(route('comments.store', props.task.id), {
        body: replyForm.body,
        parent_id: comment.id,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            replyForm.reset()
            replyFormParentId.value = null
        },
    })
}

function startReplyEdit(reply: any) {
    editingReplyId.value = reply.id
    editingReplyBody.value = reply.body
}

function cancelReplyEdit() {
    editingReplyId.value = null
    editingReplyBody.value = ''
}

function saveReply(reply: any) {
    if (!editingReplyBody.value.trim() || editingReplyBody.value === reply.body) {
        cancelReplyEdit()
        return
    }
    router.put(route('comments.update', reply.id), {
        body: editingReplyBody.value,
    }, {
        preserveScroll: true,
        onSuccess: () => cancelReplyEdit(),
    })
}

function refreshPage() {
    router.reload({ preserveScroll: true })
}

function renderMentions(body: string): string {
    const sanitized = DOMPurify.sanitize(body)
    return sanitized.replace(/@(\w+)/g, '<span class="text-brand-primary-500 font-medium">@$1</span>')
}

function quickTransition(status: string) {
    statusUpdating.value = true
    router.patch(route('tasks.status', props.task.id), { status }, {
        preserveScroll: true,
        onFinish: () => { statusUpdating.value = false },
    })
}

function toggleEmployeeBlockForm() {
    showEmployeeBlockForm.value = !showEmployeeBlockForm.value
    if (showEmployeeBlockForm.value) {
        employeeBlockReason.value = ''
    }
}

function submitEmployeeBlock() {
    if (!employeeBlockReason.value.trim()) return
    router.post(route('tasks.block', props.task.id), { blocked_reason: employeeBlockReason.value }, {
        preserveScroll: true,
        onSuccess: () => {
            showEmployeeBlockForm.value = false
            employeeBlockReason.value = ''
        },
    })
}

function submitEmployeeEta() {
    employeeEtaUpdating.value = true
    employeeEtaForm.put(route('tasks.update', props.task.id), {
        preserveScroll: true,
        onFinish: () => { employeeEtaUpdating.value = false },
    })
}

function submitProgressNote() {
    if (!progressNote.value.trim()) return
    progressNoteProcessing.value = true
    router.post(route('comments.store', props.task.id), {
        body: `🔧 **[Progress Update]** ${progressNote.value}`
    }, {
        preserveScroll: true,
        onSuccess: () => {
            progressNote.value = ''
        },
        onFinish: () => {
            progressNoteProcessing.value = false
        }
    })
}

function doDeleteTask() {
    confirmDeleteTaskProcessing.value = true
    router.delete(route('tasks.destroy', props.task.id), {
        onSuccess: () => { confirmDeleteTask.value = false },
        onFinish: () => { confirmDeleteTaskProcessing.value = false },
    })
}
</script>