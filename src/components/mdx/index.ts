import Figure from "../Figure.astro";
import Aside from "../writing/Aside.astro";
import Callout from "../writing/Callout.astro";
import DemoBox from "../writing/DemoBox.astro";
import DemoBoxExcerpt from "../writing/DemoBoxExcerpt.astro";
import Diagram from "../writing/Diagram.astro";
import Kbd from "../writing/Kbd.astro";
import Mark from "../writing/Mark.astro";
import MoreAnchor from "./MoreAnchor.astro";

// MDX 글에서 import 없이 쓰는 컴포넌트.
const writing = { Aside, Callout, Diagram, Figure, Kbd, Mark };

/** 글 목록 미리보기(excerpt 모듈): 데모는 코드 보기 없이 데모만 보여준다. */
export const excerptComponents = { ...writing, DemoBox: DemoBoxExcerpt };

/** 글 페이지: `more` 자리에 #more 앵커를 둔다. */
export const fullComponents = { ...writing, DemoBox, PostMore: MoreAnchor };
