<template>
    <AppLayout>
        <Head title="Monitoring" />

        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">System Monitoring</h2>
                        <p class="mt-1 text-sm text-gray-500">
                            Last checked: {{ formattedTime }}
                        </p>
                    </div>
                    <div class="flex gap-3">
                        <button
                            @click="refreshCheck"
                            :disabled="loading"
                            class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            <svg v-if="loading" class="-ml-1 mr-2 h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <svg v-else class="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {{ loading ? 'Checking...' : 'Refresh' }}
                        </button>
                    </div>
                </div>

                <!-- Overall Status Banner -->
                <div :class="overallClass" class="mb-6 rounded-lg p-4">
                    <div class="flex items-center">
                        <div :class="overallDotClass" class="h-3 w-3 rounded-full" />
                        <div class="ml-3">
                            <p class="text-sm font-medium">{{ overallTitle }}</p>
                            <p class="text-sm opacity-75">{{ overallMessage }}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <!-- Database -->
                    <StatusCard title="Database" :status="dbStatus" :icon="dbIcon">
                        <StatusRow label="Latency" :value="data.database?.latency_ms + ' ms'" />
                        <StatusRow label="Connections" :value="data.database?.active_connections" />
                        <StatusRow label="Name" :value="data.database?.database" />
                    </StatusCard>

                    <!-- Redis -->
                    <StatusCard title="Redis" :status="redisStatus" :icon="redisIcon">
                        <StatusRow label="Latency" :value="data.redis?.latency_ms + ' ms'" />
                        <StatusRow label="Memory" :value="data.redis?.used_memory" />
                        <StatusRow label="Uptime" :value="formatUptime(data.redis?.uptime_seconds)" />
                    </StatusCard>

                    <!-- Cache -->
                    <StatusCard title="Cache" :status="cacheStatus" :icon="cacheIcon">
                        <StatusRow label="Driver" :value="data.cache?.driver" />
                    </StatusCard>

                    <!-- Queue / Horizon -->
                    <StatusCard title="Queue" :status="queueStatus" :icon="queueIcon">
                        <StatusRow label="Driver" :value="data.queue?.driver" />
                        <StatusRow label="Horizon" :value="data.queue?.horizon" />
                        <StatusRow label="Pending Jobs" :value="data.queue?.pending_jobs" />
                        <StatusRow :label="'Failed Jobs'" :value="data.queue?.failed_jobs" :highlight="data.queue?.failed_jobs > 0" />
                    </StatusCard>
                </div>

                <!-- Disks -->
                <div class="mt-6">
                    <h3 class="mb-4 text-lg font-semibold text-gray-900">Storage Disks</h3>
                    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div v-for="(info, name) in data.disks" :key="name" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <div class="flex items-center justify-between">
                                <h4 class="text-sm font-medium text-gray-900">{{ name }}</h4>
                                <span :class="diskStatusClass(info.status)" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">{{ info.status }}</span>
                            </div>
                            <div class="mt-3">
                                <div class="relative h-2 w-full rounded-full bg-gray-200">
                                    <div
                                        :class="diskBarClass(info.status)"
                                        class="absolute left-0 top-0 h-2 rounded-full transition-all"
                                        :style="{ width: info.used_percent + '%' }"
                                    />
                                </div>
                            </div>
                            <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <div>{{ info.used_percent }}% used</div>
                                <div class="text-right">{{ info.free_gb }} GB free</div>
                            </div>
                            <div v-if="info.files !== undefined" class="mt-1 text-xs text-gray-400">
                                {{ info.files }} files
                            </div>
                        </div>
                    </div>
                </div>

                <!-- App Info -->
                <div class="mt-6">
                    <h3 class="mb-4 text-lg font-semibold text-gray-900">Application</h3>
                    <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">Environment</span>
                                <span class="ml-2 font-medium text-gray-900">{{ data.app?.env }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">PHP</span>
                                <span class="ml-2 font-medium text-gray-900">{{ data.app?.php_version }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Laravel</span>
                                <span class="ml-2 font-medium text-gray-900">{{ data.app?.laravel_version }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Version</span>
                                <span class="ml-2 font-medium text-gray-900">{{ data.app?.version }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Debug</span>
                                <span class="ml-2 font-medium" :class="data.app?.debug ? 'text-red-600' : 'text-green-600'">{{ data.app?.debug }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Maintenance Mode</span>
                                <span class="ml-2 font-medium" :class="data.app?.maintenance ? 'text-yellow-600' : 'text-green-600'">{{ data.app?.maintenance }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Head } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import axios from 'axios'

interface CheckResult {
    database?: { status: string; latency_ms?: number; active_connections?: number; database?: string }
    redis?: { status: string; latency_ms?: number; used_memory?: string; uptime_seconds?: number }
    cache?: { status: string; driver?: string }
    queue?: { status: string; driver?: string; horizon?: string; pending_jobs?: number; failed_jobs?: number }
    disks?: Record<string, { status: string; path?: string; total_gb?: number; used_gb?: number; free_gb?: number; used_percent?: number; files?: number }>
    app?: { env: string; debug: boolean; php_version: string; laravel_version: string; version: string; timezone: string; maintenance: boolean }
    timestamp?: string
}

const loading = ref(false)
const data = ref<CheckResult>({})
const error = ref<string | null>(null)

const formattedTime = computed(() => {
    if (!data.value.timestamp) return '—'
    return new Date(data.value.timestamp).toLocaleString()
})

const overallStatus = computed(() => {
    const checks = [data.value.database?.status, data.value.redis?.status, data.value.cache?.status]
    if (checks.some(s => s === 'error')) return 'error'
    if (checks.some(s => s !== 'ok')) return 'degraded'
    return 'ok'
})

const overallClass = computed(() => ({
    'bg-green-50 text-green-800': overallStatus.value === 'ok',
    'bg-yellow-50 text-yellow-800': overallStatus.value === 'degraded',
    'bg-red-50 text-red-800': overallStatus.value === 'error',
}))

const overallDotClass = computed(() => ({
    'bg-green-500': overallStatus.value === 'ok',
    'bg-yellow-500': overallStatus.value === 'degraded',
    'bg-red-500': overallStatus.value === 'error',
}))

const overallTitle = computed(() => ({
    ok: 'All Systems Operational',
    degraded: 'System Degraded',
    error: 'System Error',
}[overallStatus.value] || 'Unknown'))

const overallMessage = computed(() => {
    if (overallStatus.value === 'ok') return 'All health checks are passing.'
    const failed: string[] = []
    if (data.value.database?.status !== 'ok') failed.push('Database')
    if (data.value.redis?.status !== 'ok') failed.push('Redis')
    if (data.value.cache?.status !== 'ok') failed.push('Cache')
    return `Issues detected: ${failed.join(', ')}`
})

function statusValue(status: string | undefined): string {
    if (!status) return 'unknown'
    if (status === 'ok') return 'ok'
    if (status === 'error' || status === 'critical') return 'error'
    return 'warning'
}

const dbStatus = computed(() => statusValue(data.value.database?.status))
const redisStatus = computed(() => statusValue(data.value.redis?.status))
const cacheStatus = computed(() => statusValue(data.value.cache?.status))
const queueStatus = computed(() => {
    if (!data.value.queue?.status) return 'unknown'
    if (data.value.queue.status === 'ok') return data.value.queue.failed_jobs > 0 ? 'warning' : 'ok'
    return data.value.queue.status as string
})

function diskStatusClass(status: string | undefined): string {
    const cls = statusValue(status)
    if (cls === 'ok') return 'bg-green-100 text-green-800'
    if (cls === 'warning') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
}

function diskBarClass(status: string | undefined): string {
    const cls = statusValue(status)
    if (cls === 'ok') return 'bg-green-500'
    if (cls === 'warning') return 'bg-yellow-500'
    return 'bg-red-500'
}

function formatUptime(seconds: number | undefined): string {
    if (!seconds) return '—'
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    return `${d}d ${h}h`
}

async function refreshCheck() {
    loading.value = true
    error.value = null
    try {
        const res = await axios.get('/api/health')
        data.value = res.data.checks
    } catch (e: any) {
        if (e.response?.data?.checks) {
            data.value = e.response.data.checks
        }
        error.value = e.response?.data?.message || e.message
    } finally {
        loading.value = false
    }
}

onMounted(refreshCheck)
</script>

<script lang="ts">
// ─── Lighter-weight inline components to avoid extra files ─────────────────
import { defineComponent, h } from 'vue'

const StatusIcon = defineComponent({
    props: { status: String },
    setup(props) {
        return () => {
            const cls = props.status === 'ok' ? 'text-green-500' : props.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
            return h('div', { class: `flex-shrink-0 ${cls}` }, [
                props.status === 'ok'
                    ? h('svg', { class: 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
                        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': 2, d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
                    ])
                    : props.status === 'warning'
                        ? h('svg', { class: 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
                            h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': 2, d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' })
                        ])
                        : h('svg', { class: 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
                            h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': 2, d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })
                        ])
            ])
        }
    }
})

const StatusCard = defineComponent({
    props: { title: String, status: String, icon: { type: Object, default: null } },
    setup(props, { slots }) {
        const borderClass = computed(() => ({
            'border-green-200': props.status === 'ok',
            'border-yellow-200': props.status === 'warning',
            'border-red-200': props.status === 'error',
        } as Record<string, boolean>))
        const bgClass = computed(() => ({
            'bg-green-50': props.status === 'ok',
            'bg-yellow-50': props.status === 'warning',
            'bg-red-50': props.status === 'error',
        } as Record<string, boolean>))

        return () => h('div', { class: ['rounded-lg border p-5 shadow-sm', borderClass.value, bgClass.value] }, [
            h('div', { class: 'flex items-center justify-between mb-4' }, [
                h('div', { class: 'flex items-center gap-2' }, [
                    props.icon ? h(StatusIcon, { status: props.status }) : null,
                    h('h3', { class: 'text-lg font-semibold text-gray-900' }, props.title),
                ]),
                h('span', {
                    class: [
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                        props.status === 'ok' ? 'bg-green-100 text-green-800' : props.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    ]
                }, props.status),
            ]),
            h('div', { class: 'space-y-2' }, slots.default?.()),
        ])
    }
})

const StatusRow = defineComponent({
    props: { label: String, value: [String, Number], highlight: { type: Boolean, default: false } },
    setup(props) {
        return () => h('div', { class: 'flex justify-between text-sm' }, [
            h('span', { class: 'text-gray-500' }, props.label),
            h('span', { class: [props.highlight ? 'text-red-600 font-semibold' : 'font-medium text-gray-900'] }, String(props.value ?? '—')),
        ])
    }
})
</script>
