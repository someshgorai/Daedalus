declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number
      url?: string
    }

    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Tab[]) => void,
    ): void

    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
    ): Promise<Tab[]>
  }

  namespace scripting {
    interface InjectionResult<T = unknown> {
      result?: T
    }

    function executeScript<T = unknown>(details: {
      target: { tabId: number }
      func: () => T
    }): Promise<InjectionResult<T>[]>
  }
}
