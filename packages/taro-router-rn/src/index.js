import React from 'react'
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation'
import { Image } from 'react-native'
import queryString from 'query-string'

// 页面默认头部样式
const defaultNavigationOptions = {
  headerStyle: {
    backgroundColor: 'grey'
  },
  headerTintColor: 'black'
}

/**
 * @description 包裹页面 Screen 组件，处理生命周期，注入方法
 * @param Screen 页面的组件
 * @param Taro 挂在方法到 Taro 上
 * @returns {WrappedScreen}
 */
function getWrappedScreen (Screen, Taro) {
  class WrappedScreen extends Screen {
    constructor (props, context) {
      super(props, context)
      // 这样处理不一定合理，
      // 有时间看一下 react-navigation 内部的实现机制再优化
      Taro.navigateTo = this.wxNavigateTo.bind(this)
      Taro.redirectTo = this.wxRedirectTo.bind(this)
      Taro.navigateBack = this.wxNavigateBack.bind(this)
      Taro.switchTab = this.wxSwitchTab.bind(this)
      Taro.getCurrentPages = this.wxGetCurrentPages.bind(this)
    }

    componentDidMount () {
      super.componentDidMount && super.componentDidMount()
      super.componentDidShow && super.componentDidShow()
    }

    componentWillUnmount () {
      super.componentDidHide && super.componentDidHide()
      super.componentWillUnmount && super.componentWillUnmount()
    }

    wxNavigateTo ({url, success, fail, complete}) {
      let obj = queryString.parseUrl(url)
      console.log(obj)
      try {
        this.props.navigation.push(obj.url, obj.query)
      } catch (e) {
        fail && fail(e)
        complete && complete(e)
        throw e
      }
      success && success()
      complete && complete()
    }

    wxRedirectTo ({url, success, fail, complete}) {
      let obj = queryString.parseUrl(url)
      console.log(obj)
      try {
        this.props.navigation.replace(obj.url, obj.query)
      } catch (e) {
        fail && fail(e)
        complete && complete(e)
        throw e
      }
      success && success()
      complete && complete()
    }

    wxSwitchTab ({url, success, fail, complete}) {
      let obj = queryString.parseUrl(url)
      console.log(obj)
      try {
        this.props.navigation.navigate(obj.url, obj.query)
      } catch (e) {
        fail && fail(e)
        complete && complete(e)
        throw e
      }
      success && success()
      complete && complete()
    }

    wxNavigateBack ({delta = 1}) {
      while (delta > 0) {
        this.props.navigation.goBack()
        delta--
      }
    }

    wxGetCurrentPages () {
      let parentState = this.props.navigation.dangerouslyGetParent().state
      if (parentState && parentState.routes) {
        return parentState.routes.map(item => item.routeName)
      } else {
        return []
      }
    }
  }

  return WrappedScreen
}

function getRootStack ({pageList, Taro, navigationOptions}) {
  let RouteConfigs = {}
  pageList.forEach(v => {
    const pageKey = v[0]
    const Screen = v[1]
    RouteConfigs[pageKey] = getWrappedScreen(Screen, Taro)
  })
  return createStackNavigator(RouteConfigs, {
    navigationOptions: Object.assign({}, defaultNavigationOptions, navigationOptions)
  })
}

/**
 * @param pageList
 * @param Taro
 * @param navigationOptions
 * @param tabBar
 * @returns {*}
 */
const initRouter = (pageList, Taro, {navigationOptions = {}, tabBar}) => {
  let RouteConfigs = {}

  if (tabBar && tabBar.list) {
    const tabPathList = tabBar.list.map(item => item.pagePath)

    // newPageList 去除了 tabBar 配置里面的页面，但包含当前 tabBar 页面
    // 防止页面跳转时 tabBar 和 stack 相互干扰，保证每个 tabBar 堆栈的独立性
    tabBar.list.forEach((item) => {
      const tabPath = item.pagePath
      const newTabPathList = tabPathList.filter(item => item !== tabPath) // 去除当前 tabPth
      const newPageList = pageList.filter(item => newTabPathList.indexOf(item[0]) === -1) // 去除 newTabPathList 里的 pagePath

      RouteConfigs[tabPath] = getRootStack({pageList: newPageList, Taro, navigationOptions})
    })
    // TODO tabBar.position
    return createBottomTabNavigator(RouteConfigs, {
      navigationOptions: ({navigation}) => ({
        tabBarIcon: ({focused, tintColor}) => {
          const {routeName} = navigation.state
          const iconConfig = tabBar.list.find(item => item.pagePath === routeName)
          return (
            <Image
              style={{width: 30, height: 30}}
              source={focused ? iconConfig.selectedIconPath : iconConfig.iconPath}
            />
          )
        },
        tabBarLabel: tabBar.list.find(item => item.pagePath === navigation.state.routeName).text,
        tabBarVisible: navigation.state.index === 0 // 第一级不显示 tabBar
      }),
      tabBarOptions: {
        backBehavior: 'none',
        activeTintColor: tabBar.selectedColor || '#3cc51f',
        inactiveTintColor: tabBar.color || '#7A7E83',
        activeBackgroundColor: tabBar.backgroundColor || '#ffffff',
        inactiveBackgroundColor: tabBar.backgroundColor || '#ffffff',
        style: {
          borderColor: tabBar.borderTopColor || '#c6c6c6'
        }
      }
    })
  } else {
    return getRootStack({pageList, Taro, navigationOptions})
  }
}

export default {initRouter}

export { initRouter }
