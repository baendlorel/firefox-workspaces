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

---

新增功能：同步指示器，要求如下:

1. 我在header.ts里写了一个变量为`syncIcon`，用它做指示器
2. syncIcon放在header里，放在右侧的两个按钮的左边，样式不要太显眼，可以透明一些
3. syncIcon有三种状态，分别是同步中、同步成功、同步失败
4. syncIcon平时颜色是transparent，也就是看不到。
5. 同步中时，syncIcon的颜色为空，也就是默认颜色。它会旋转，表示正在同步
6. 同步成功时，syncIcon是绿色，8秒后又变回透明,可以用tansition 0.8s来做到
7. 同步失败时，syncIcon是红色，不变透明。点击它会弹出info对话框，显示失败原因
8. 如果settings.sync = off，那么这个syncIcon就看不见

---

syncIndicator导出是完全没必要的，我已经该回去了,header(bus)依然只需要返回header元素本身即可。然后，使用bus的事件触发来做到修改syncicon状态的效果，思路是：

1. 在const.ts里新建const enum为可SyncState
2. 在web.d.ts里增加一个事件类型为`change-sync-state`，可传入一个参数为SyncState类型
3. 现在假设后台发起了一次同步
4. background获取当前的popup页面，并调用其中的emit成员来触发`change-sync-state`事件，传入表示正在同步的信息；
5. header.ts监听这个事件，并根据传入的状态来修改syncicon的状态
6. 如果syncIcon正在转，请保持它至少转满1.2秒

---

我制作的是火狐的插件，但我也希望兼容chrome。我知道有npm包能做到，但是那个包已经一年多没更新，我不信任。请你帮我写一个兼容层：

1. 写在src/lib/polyfill.ts里；
2. 扫描所有src/和pages/下的ts文件，检测browser对象的使用
3. 根据browser的使用，在polyfill.ts里写对应的chrome实现
4. 只需要实现我用到的那些api
5. 不要改动我的其他代码，你只需要写polyfill.ts

---

我发现，我的插件显示的文字比浏览器自己菜单上、收藏夹上的文字体积要大，请你帮我想办法缩小我的文字体积。
经过我用windows画图工具的测量，我的插件文字体积和浏览器文字体积的宽度比例大约是25:19。

---

我发现滚动条样式设计不如意，现在我自己制作了up和down两个按钮，你来完善，要求：

1. 点击一次上下滚动1格距离，1格距离通过获取wb-ul-container的属性值--wbli-height来得到
2. --wbli-height值不会变，你获取一次即可
3. 按住不放会持续滚动，间隔平均1秒滚动5次
4. 如果滚到最上方或最下方了，会隐藏那一侧按钮。每次滚动都要刷新up和down按钮的显示隐藏状态

---

实现一个新功能，密码锁定的工作区

1. WorkspaceTab页面增加字段: password它是密码的sha256哈希值;passpeek是用户密码的前面3位明文。
2. 在editor.ts也要增加密码输入框。如果密码trim后为空，那么不设定密码，passwork和passpeek都是空字符串。
3. 密码可以修改，但要输入旧密码，确认两遍新密码才可以。
4. 密码不能少于3位
5. 在list.ts里，如果一个workspace有密码，那么在li上显示一个锁的图标
6. 在popup.ts里，如果点击了一个有密码的workspace，那么弹出一个对话框，要求输入密码，密码正确则打开workspace，密码错误则提示
7. 密码错误3次后，锁定60秒，期间不允许输入密码. 此效果允许增加WorkspaceTab的字段来实现，你自行决定。

---

1. 导入导出不再需要校验hash了，直接导入导出json就行，也不用压缩了
2. 导出界面是pages/export.html，请以我的风格完成它
3. 如果导出的包含加密的工作区，那么在导出界面生成一个表单，里面是所有加密工作区的名字和密码输入框
   只有输入全部密码并正确的，才能导出，如果密码错误，则那一条不给导出。
4. 导出完成后，如果密码全都对的，那么可以关闭窗口。如果有密码输错的，不要关闭导出窗口，给用户一个重试的机会，错误密码的输入框标红色边框shadow特效；

---

我有4个todo，但一起完成怕难以审核，你先完成第一个“打开的工作区里，顶部栏是不是加点颜色？”，详细要求如下：
现状：现在每个Workspace对象都有一个color，打开一个新工作区后，会判断当前处于哪个工作区，并修改header里面的标题。
要求：

1. header的背景改为从上到下的渐变，上的颜色是透明度为0.4的这个color。下的颜色是transparent

---

我稍加修改后，第一个todo圆满完成了。现在来做第二个：pin功能。
现状：原本已经决定不再使用pin，因为pin的过程非常看浏览器心情， 即便我调用pin，它也不一定就会被pin好。
但实际使用插件后，我依然发现，pin了还是好，如果能pin成功是最好
要求：

1. 我写了一个辅助函数叫tryUntil，请你先学习这个函数，待会有用。
2. 我保留了WindowsTab这个类型定义的pinned字段，请你再次在其他地方添加对pin的处理。比如创建tab的时候要带pinned字段，在onupdated事件和oncreated事件中要实时侦听一个tab是否pin的变化，如果不pin了，那么要及时更新到storage里面。
3. 如果一个标签是被pin的，那么在打开工作区时，要尽可能把它pin好。你可以用tryUntil来反复尝试pin，直到成功为止。(可以在pin一个标签后的下一个间隔检测它是否状态是pin过的，pin过就停止)
4. 如果一个标签页是被pin的，那么只要没有侦听到它手动被解除了pin，那么storage里它就得一直留着，一直保持存在，即便它被关闭了也没关系。也就是说，pin的标签页只要不手动解pin，那么就一直存在于storage里。

---

我前面说得不太清楚，实现效果也不佳，我重新做要求：

1. 辅助函数tryUntil，依然要用。
2. 打开workspace的时候，open函数不变，但是open函数要给每个tab开启一个task，这个task用tryUntil完成，做到把该pin的标签页pin好。
3. 如果一个标签页是被pin的，只要没有手动解除pin，它在persist里的pinned就应该一直为true
4. 不需要改动事件侦听了
