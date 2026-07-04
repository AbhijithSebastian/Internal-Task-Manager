declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module 'ziggy-js' {
    import type { Router } from 'ziggy-js'
    const ZiggyVue: any
    export { ZiggyVue }
}

interface Window {
    route: any
    Ziggy: any
}
