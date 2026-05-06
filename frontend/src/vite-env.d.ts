/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEELYHUB_LOGIN_URL?: string;
  readonly VITE_DEV_API_TARGET?: string;
  /** true=未登录必跳 Geelyhub；false=不跳。未设时：开发不跳、生产跳 */
  readonly VITE_REQUIRE_GEELYHUB_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
