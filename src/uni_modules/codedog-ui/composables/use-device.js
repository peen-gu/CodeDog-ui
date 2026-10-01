/**
 * CodeDogUI / useDevice —— 组件最常用的组合入口
 * ---------------------------------------------------------------
 * 把「我在哪端」和「容器多宽」合并成一个调用，
 * 双形态组件只要一行 useDevice() 就能拿到全部决策依据。
 *
 * 典型用法：
 *   const { isPC, isMobile, breakpoint } = useDevice()
 *
 * 注意 isPC 与 isDesktop 的区别：
 *   - isDesktop：视口宽度 >= 1024，单纯的尺寸事实
 *   - isPC：     H5 端 + 宽视口 + 有鼠标，是「交互形态」结论
 *   组件的双形态切换一律用 isPC，不要用 isDesktop。
 */

import { computed } from 'vue'
import { usePlatform } from './use-platform'
import { useBreakpoint } from './use-breakpoint'

export function useDevice() {
  const platform = usePlatform()
  const bp = useBreakpoint()

  return {
    /* 平台 */
    ...platform,

    /* 断点 */
    ...bp,

    /**
     * 内容密度：PC 端信息密度更高，移动端更宽松。
     * 组件可以用它决定 padding / 字号档位。
     */
    density: computed(() => (bp.isPC.value ? 'compact' : 'comfortable')),

    /** 当前是否应使用桌面布局形态（isPC 的语义别名，模板里读起来更顺） */
    isDesktopShape: computed(() => bp.isPC.value),
  }
}

export default useDevice
