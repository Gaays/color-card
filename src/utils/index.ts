import { ref } from 'vue'

// 节流函数
export function throttle(fn: Function, delay: number) {
  let lastTime = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

export const useTimeCount = () => {
  let currentTime

  const initTime = () => {
    currentTime = Date.now().valueOf()
  }

  const getTime = () => {
    return Date.now().valueOf() - currentTime
  }

  return {
    initTime,
    getTime
  }
}

export const useBtnCount = () => {
  let count = ref(0)

  const initCount = () => {
    count.value = 0
  }

  const addCount = () => {
    count.value++
    console.log(count.value)
  }

  return {
    count,
    initCount,
    addCount
  }
}