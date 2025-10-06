编写一个 firefox 浏览器插件，要求如下：

1. 插件模仿 edge 的工作组功能
2. 工作组是一组标签页
3. 可以新增删除工作组，指定工作组的颜色
4. 可以将标签页拖动到不同的工作组
5. 可以将标签页从工作组中移除
6. 可以在工作组中固定标签页
7. 打开工作组就是在新的浏览窗口中打开工作组中的一整组标签，区分固定的和没固定的标签页
8. 每次关闭某个工作组的浏览窗口时，会记录下当前工作组有哪些固定的和没有固定的标签页，下次打开时恢复
9. 注释用英文写
10. 写完后，写一份中文版描述说明书，描述这个东西的使用方法、特性，写在 draft/instruction.md 中

> 注意： 我对 firefox 插件能力边界不熟悉，你可以停止询问我或采取替代方案！

---

我已经把你写的代码移动到 src 文件夹下。
我已经写好 tsconfig 配置文件，现在请你改写，要求如下：

1. 用 typescript 写
2. 使用函数式编程，方便测试
3. 在 tests/文件夹下分模块写测试代码
4. 帮我在 package.json 里加一个叫"package"的打包命令，可以一键打包测试

---

我已经在src/types/message.d.ts写好了Response的类型，并且在消息接收方做好了类型标注。
现在请你：

1. 找到消息发送方，根据发送的数据编写Request的类型，并且做好类型标注
2. 确保消息发送方和接收方的类型是匹配的

---

本插件的初版是你写的，我进行了ts化，终于标好了所有类型。但是标完以后我发现了问题，这个项目疑似没有写完，或者说有冗余功能。比如src/content.ts中的一段

```ts
class WorkspacesContent {
  private lastContextElement: EventTarget | null = null;
  private lastContextPosition: { x: number; y: number } = { x: 0, y: 0 };
  // ...
}
```

这里的两个private变量完全没有用上；
请根据我最初的需求，检查到底是没完成，还是冗余功能的。下面是我的原版需求:

```md
制作一个firefox浏览器插件

1. 插件模仿 edge 的工作组功能
2. 工作组是一组标签页
3. 可以新增删除工作组，指定工作组的颜色
4. 可以将标签页拖动到不同的工作组
5. 可以将标签页从工作组中移除
6. 可以在工作组中固定标签页
7. 打开工作组就是在新的浏览窗口中打开工作组中的一整组标签，区分固定的和没固定的标签页
8. 每次关闭某个工作组的浏览窗口时，会记录下当前工作组有哪些固定的和没有固定的标签页，下次打开时恢复
9. 注释用英文写
```

---

来自于写第三方库的习惯，我缓存了很多原生方法，也写了一些自制方法。 请你查看:

1. 浏览器插件环境里，这些缓存是否有必要？
2. 如果有的话，src下哪些ts文件属于有必要的文件，哪些文件是没有必要的；
3. 如果完全没有必要，那么你可以帮我全都改回普通的写法来；
4. 如果有必要，那请你根据实际代码内容，按需要缓存更多原生方法并应用它们

---

帮我写vite打包配置：

1. 只看src/文件夹下的ts文件
2. src打包后的代码直接放入dist而不是dist/src
3. 帮我利用`@types/firefox-webext-browser`写一些测试命令，放在package.json里

---

我要用这个class来mock浏览器插件环境的browser对象，以此做到测试，你帮我完成createResponse函数，要求:

1. 根据不同的action创建类型标注的回复
2. 在一次测试中，最好能让action之间相互有联动，比如新建的workspace，在getworkspaces的时候能get到
3. 所有保存的数据会缓存在localstorage中以便刷新的时候加载
4. 用h函数来创建一个小小的工具栏名为toolbar，它会附着在整个页面中间的顶部。
5. toolbar至少拥有清空缓存、创建3个随机workspace等功能
6. toolbar可以控制回复的success字段是true还是false，可以用一个checkbox来切换，这样方便我测试失败场景

---

强化workspace功能:

1. 'open'事件的初衷是打开一个新的浏览器窗口，然后打开所有的标签页和并pin那些pinned的标签页，你检查下，如果符合就不用改；
2. 插件要记录当前开了哪几个工作区，可以按数组存储，以id相同视为已经存在，并且在主页列表里高亮显示（可以给这一条li元素加上这个workspace的color的带有0.3alpha的背景）
3. 想办法让打开的窗口和workspace有所关联（现在应该是有的，有一个windowId）
4. 如果反复open一个已经打开的workspace，那么就切换到那个窗口
5. 如果当前正在关闭一个浏览器窗口，且这个窗口是一个workspace关联的，则关闭的时候触发工作区保存，保存并更新当前工作区的tab和pinnedtab；
6. 如果当前没有开启任何工作区，那么当前工作区数组为空；

---

改造这一段swtich，要求：

1. 改为 if+return的形式
2. 所有的satisfies改为 `const response: MessageResponseMap[typeof action]= {...}`的格式，然后return response

---

`InputColorPicker`
完成这个组件，要求能够选择所有颜色，只需要支持#rrggbb即可。value可以设置，
invalid的value会变为白色

---

用h函数和div函数，构建一个颜色选择器，要求:

1. 颜色选择器是一个圆形的div，长宽都是28px
2. 圆形中有一个锥形渐变，渐变色为彩虹顺序，首尾相连；
3. 点击这个圆形，鼠标位置会出现一个放大镜一样的小的圆形div，这个div会显示鼠标点击部分的颜色，并在下方显示hex值。
4. 不需要支持alpha因为没什么使用场景；
5. 点击这个圆形，按住鼠标，放大镜和hex值会跟着鼠标一起走

---

<!-- indicator  -->
<!--   picker   -->
<!--    alpha   -->
<!--     hue    -->

完成这个函数，要求：

1. indicator，是input输入框，它表示最终选择的颜色；
2. alpha和hue都是条，alpha从上倒下是100%到0%，hue是从上倒下是红橙黄绿青蓝紫红；
3. 3者都要可以点选，交互。点选的时候会有一个小标志显示当前选择位置；
4. hue决定picker的颜色，picker决定indicator的颜色，alpha决定indicator的透明度；
5. picker是一个矩形，渐变，左上角是白色，左下角是黑色，右下角是黑色，右上角是hue的颜色

---

在不改动其他代码的前提下，整合本文件的内容，写一个新的class Color放在src/lib/color.ts里。:

1. 可以用静态create方法以HSV为入参创建颜色；
2. 静态方法from，可以做到从#rrggbb或#rrggbbaa创建颜色；
3. 含有public的属性r,g,b,a
4. 编写多个转换方法，可以直接转换为#rrggbb、#rrggbbaa；
5. 编写adjust-brightness方法，可以调整亮度，入参是一个-1~1的数字，负数表示变暗，正数表示变亮

---

完成这个函数，要求：

1. 加载图片public/icon-128.png
2. 用canvas把图片染成传入的颜色
3. 把染色后的图片转换为 new ImageData(data: ImageDataArray, sw: number, sh?: number); 并返回。

---

我编写了promise-ext扩展，这个fallback的功能类似于当前的catch(reject(...))。
请你扫描我使用了catch(reject(...))的地方，帮我改写成fallback(...)的形式。如果是在class方法中调用，那么则要使用带有functionName的定义（functionName统一传入参数为`__func__`，不需要硬编码方法名）

---

在这个文件中编写一个点击展开的菜单，不要改动别的文件，要求:

1. 这个菜单用dialog写成，有阴影
2. 可以点击backdrop关闭，这应该是最简单的做法，其他任何事件点击都会有副作用
3. 这个菜单默认不显示
4. 写一个函数show(x,y)来控制它在屏幕的某处展示
5. 入参是一个options数组。数组里面是{label:string|HTMLElement,action:()=>void}

---

刚才的open函数调试问题我已经解决，但这也让我意识到，插件为了减少开销，popup页面会因为失去焦点关闭而直接被销毁，每次都是新的。这一样一来，我的很多数据同步操作都没有必要了。请你根据这个来扫描src下的代码，评估可以缩减的同步操作，不要改动代码，而是把评估结果输出到.draft/evaluation.md。

---

帮我完成：

1. 菜单中的导入导出；
2. 设置界面，添加几个你认为可行的设置；
3. 完成Create with current tabs，功能是用当前窗口的标签页创建新workspace：
   - 点击后缓存当前window的所有tab，以Workspace.from处理它们，并弹出新建窗口，新建完成后将tabs全都纳入其中；
   - 可以将Create事件扩展为可以传输tabs数组，已有的触发createworkspace事件的地方对tabs传入空数组；
   - 创建workspace完成后将其打开；
4. 美化about.ts，要美观、简洁、酷炫、层次分明

---

因为popup用inputfile会直接失去焦点被销毁。所以现在只能用content.js了。你帮我完成:

1. background.ts的onmessage收到Action.import后，主动把content.js注入当前活跃的页面，并立刻打开一个inputfile；
2. inputfile要求是json格式;
3. 用户选择、确认后，将文本读取出来，传递到background.ts进行导入逻辑
4. 导入时校验hash；
5. 导入完成后，可以消除content.js注入
6. 在background.ts里弹一个notification来展示导入结果。
7. 导入逻辑中，workspaces字段只新增不覆盖，settings字段覆盖

---

早期由其他ai生成的`_locales`文件中，键名不是很统一，不是很规范。后来我发现，采取`xxx.aaa-bbb-ccc.xxx-yyy`这个格式，可读性是最好的，也很清晰。请你帮我把格式全部改成这种，对应文件也要修改。
