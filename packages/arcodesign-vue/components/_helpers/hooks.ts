// Note: Generated by AI, needs verification
// packages/arcodesign-vue/components/_helpers/hooks.ts

import { Ref, onMounted, onUnmounted, watch, ref } from 'vue';

// 用于生成唯一的 SVG key，避免不同组件之间的 ID 冲突
// @en Generate a unique SVG key to avoid ID conflicts between different components
export function useGenSvgKey(defaultKey?: string) {
    const svgKey = ref(defaultKey || Math.random().toString(36).substring(2, 15));

    watch(
        () => defaultKey,
        newKey => {
            svgKey.value = newKey || Math.random().toString(36).substring(2, 15);
        },
    );

    return { svgKey };
}

// 用于处理元素的点击外部事件
// @en Handle clicks outside an element
export function useClickOutside(targetRef: Ref<HTMLElement>, callback: () => void) {
    const handleClick = (event: MouseEvent) => {
        if (targetRef.value && !targetRef.value.contains(event.target as Node)) {
            callback();
        }
    };

    onMounted(() => {
        document.addEventListener('click', handleClick);
    });

    onUnmounted(() => {
        document.removeEventListener('click', handleClick);
    });
}
