export const promisifyLoader = (loader, onProgress) => {

  const promiseLoader = url => {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, onProgress, reject);
    });
  }
  return {
    originalLoader: loader,
    load: promiseLoader,
  };
}