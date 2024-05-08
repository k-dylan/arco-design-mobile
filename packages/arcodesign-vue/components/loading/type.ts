export type LoadingType = 'spin' | 'circle' | 'arc' | 'dot';

export interface LoadingProps {
    /**
     * 自定义样式
     * @en Custom stylesheet
     */
    style?: React.CSSProperties;
    /**
     * 自定义类名
     * @en Custom classname
     */
    className?: string;
    /**
     * 主颜色，如果想使用 css 控制主颜色，可使用公共 mixin `.set-loading-color(@color)`
     * @en The main color, if you want to use css to control the main color, you can use the public mixin `.set-loading-color(@color)`
     */
    color?: string;
    /**
     * loading类型
     * @en Loading type
     * @default "dot"
     */
    type?: LoadingType;
    /**
     * 当类型为`dot`或`spin`时有效，定义内部各元素的透明度
     * @en Valid when the type is `dot` or `spin`, defines the transparency of each element inside
     */
    list?: number[];
    /**
     * 一次loading周期的毫秒数
     * @en A loading cycle in millisecond
     * @default 1000
     */
    duration?: number;
    /**
     * 区分不同loading组件间的`<def>`内容
     * @en Distinguish the `<def>` content of different svg
     */
    svgKey?: string;
    /**
     * 圆圈半径，类型为`circle`或`arc`时可用
     * @en Circle radius, available when type is `circle` or `arc`
     * @default 9
     */
    radius?: number;
    /**
     * 圆圈描边宽度，类型为`circle`或`arc`或`spin`时可用
     * @en Circle stroke width, available when type is `circle` or `arc` or `spin`
     * @default 2
     */
    stroke?: number;
    /**
     * 边缘是否为圆角
     * @en Whether the edges are rounded
     * @default true
     */
    filleted?: boolean;
}

export interface LoadingRef {
    /**
     * 最外层元素 DOM
     * @en The outermost element DOM
     */
    dom: HTMLDivElement | null;
}
