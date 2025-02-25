export default defineAppConfig({
  appId: 'wx331d8e2002a9ce05',
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index'
  ],
  window: {
    // navigationStyle: 'custom',
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '光影色卡',
    navigationBarTextStyle: 'black'
  },
  resizable: true
})
