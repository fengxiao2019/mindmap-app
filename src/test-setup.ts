import { setLang } from "./i18n";

// Node reports an English locale; the existing tests assert the Chinese messages, so pin that explicitly.
setLang("zh");
