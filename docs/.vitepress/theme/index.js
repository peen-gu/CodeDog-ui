import DefaultTheme from 'vitepress/theme'
import './cd-tokens.scss'
import './custom.css'

/**
 * 在文档站里使用 CodeDogUI 自己的组件。
 *
 * 只挑选「不依赖 uni.* API、也不依赖 wot-design-uni」的纯展示类组件：
 *   依赖列表来自 `grep -rl "uni\." components/` 的结果，
 *   affix / backtop / grid-item / tabs / slider / upload / image / notice-bar /
 *   form-item / collapse-item / breadcrumb-item / toast-host 以及 command 层服务都不在此列，
 *   它们的 uni API 调用在 Node SSR 阶段会直接 ReferenceError。
 */
import CdButton from '../../../src/uni_modules/codedog-ui/components/cd-button/cd-button.vue'
import CdTag from '../../../src/uni_modules/codedog-ui/components/cd-tag/cd-tag.vue'
import CdCard from '../../../src/uni_modules/codedog-ui/components/cd-card/cd-card.vue'
import CdIcon from '../../../src/uni_modules/codedog-ui/components/cd-icon/cd-icon.vue'
import CdBadge from '../../../src/uni_modules/codedog-ui/components/cd-badge/cd-badge.vue'
import CdDivider from '../../../src/uni_modules/codedog-ui/components/cd-divider/cd-divider.vue'
import CdRow from '../../../src/uni_modules/codedog-ui/components/cd-row/cd-row.vue'
import CdCol from '../../../src/uni_modules/codedog-ui/components/cd-col/cd-col.vue'
import CdEmpty from '../../../src/uni_modules/codedog-ui/components/cd-empty/cd-empty.vue'
import CdProgress from '../../../src/uni_modules/codedog-ui/components/cd-progress/cd-progress.vue'
import CdResult from '../../../src/uni_modules/codedog-ui/components/cd-result/cd-result.vue'
import CdTimeline from '../../../src/uni_modules/codedog-ui/components/cd-timeline/cd-timeline.vue'
import CdTimelineItem from '../../../src/uni_modules/codedog-ui/components/cd-timeline-item/cd-timeline-item.vue'
import CdSteps from '../../../src/uni_modules/codedog-ui/components/cd-steps/cd-steps.vue'
import CdStep from '../../../src/uni_modules/codedog-ui/components/cd-step/cd-step.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CdButton', CdButton)
    app.component('CdTag', CdTag)
    app.component('CdCard', CdCard)
    app.component('CdIcon', CdIcon)
    app.component('CdBadge', CdBadge)
    app.component('CdDivider', CdDivider)
    app.component('CdRow', CdRow)
    app.component('CdCol', CdCol)
    app.component('CdEmpty', CdEmpty)
    app.component('CdProgress', CdProgress)
    app.component('CdResult', CdResult)
    app.component('CdTimeline', CdTimeline)
    app.component('CdTimelineItem', CdTimelineItem)
    app.component('CdSteps', CdSteps)
    app.component('CdStep', CdStep)
  },
}
