import type { UnwrapNestedRefs } from "vue";
import { onMounted, onUnmounted, ref } from "vue";
import type { AuthSessionState, UpdateState } from "@/auth-types";
import { setActiveUserId } from "@/services/user-storage";

const emptySession: AuthSessionState = {
  configured: false,
  authenticated: false,
  user: null
};

const emptyUpdate: UpdateState = {
  status: "disabled",
  currentVersion: "",
  availableVersion: "",
  progress: 0,
  message: "更新服务不可用"
};

export function useAccountAndUpdates() {
  const authSession = ref<AuthSessionState>(emptySession);
  const updateState = ref<UpdateState>(emptyUpdate);
  const updatePromptVisible = ref(false);
  const accountBusy = ref(false);
  let removeUpdateListener: (() => void) | undefined;

  function applyUpdateState(nextState: UpdateState) {
    updateState.value = nextState;
    if (nextState.status === "available") {
      updatePromptVisible.value = true;
    }
  }

  async function refreshAccount() {
    if (!window.wageclawDesktop) return;
    authSession.value = await window.wageclawDesktop.authGetSession();
  }

  async function signOut() {
    if (!window.wageclawDesktop || accountBusy.value) return;
    if (!window.confirm("确定退出当前账号吗？本机数据会保留，下次登录后继续使用。")) return;
    accountBusy.value = true;
    try {
      await window.wageclawDesktop.authSignOut();
      setActiveUserId("");
      window.location.reload();
    } finally {
      accountBusy.value = false;
    }
  }

  async function checkForUpdates() {
    if (!window.wageclawDesktop) return;
    applyUpdateState(await window.wageclawDesktop.checkForUpdates());
  }

  async function downloadAndInstallUpdate() {
    if (!window.wageclawDesktop) return;
    updatePromptVisible.value = true;
    applyUpdateState(await window.wageclawDesktop.downloadAndInstallUpdate());
  }

  onMounted(async () => {
    if (!window.wageclawDesktop) return;
    removeUpdateListener = window.wageclawDesktop.onUpdateStatus(applyUpdateState);
    const [session, updater] = await Promise.all([
      window.wageclawDesktop.authGetSession(),
      window.wageclawDesktop.getUpdateState()
    ]);
    authSession.value = session;
    applyUpdateState(updater);
  });

  onUnmounted(() => {
    removeUpdateListener?.();
  });

  return {
    authSession,
    updateState,
    updatePromptVisible,
    accountBusy,
    refreshAccount,
    signOut,
    checkForUpdates,
    downloadAndInstallUpdate
  };
}

/** useAccountAndUpdates 返回值的响应式视图类型（ref 已解包）。 */
export type AccountStore = UnwrapNestedRefs<ReturnType<typeof useAccountAndUpdates>>;
