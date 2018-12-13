import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, WebView, PermissionsAndroid, requireNativeComponent, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import firebase from 'react-native-firebase';
import PropTypes from 'prop-types';
import type { Notification, NotificationOpen } from 'react-native-firebase';

const IMEI = require('react-native-imei');
const RCTCustomWebView = requireNativeComponent("RCTCustomWebView", App, WebView.extraNativeComponentConfig);
const { CustomWebViewManager } = NativeModules;

export default class App extends Component {

  componentDidMount = async () => {
      const enabled = await firebase.messaging().hasPermission();
      if (enabled) {
          console.warn('user has permissions');
      } else {
          console.warn('user doesnt have permission');
          try {
              await firebase.messaging().requestPermission();
              console.warn('User has authorised');
          } catch (error) {
              console.warn('User has rejected authorised');
          }
      }

      const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
      if (notificationOpen) {

          const action = notificationOpen.action;

          const notification: Notification = notificationOpen.notification;
          if (notification.body!==undefined) {
              alert(notification.body);
          } else {
              var seen = [];
              alert(JSON.stringify(notification.data, function(key, val) {
                  if (val != null && typeof val == "object") {
                      if (seen.indexOf(val) >= 0) {
                          return;
                      }
                      seen.push(val);
                  }
                  return val;
              }));
          }
          firebase.notifications().removeDeliveredNotification(notification.notificationId);
      }

      const channel = new firebase.notifications.Android.Channel('test-channel', 'Test Channel', firebase.notifications.Android.Importance.Max)
          .setDescription('My apps test channel');

      firebase.notifications().android.createChannel(channel);

      firebase.messaging().subscribeToTopic('news1');

      this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {
          console.warn('Process your notification as required');
          console.warn('ANDROID: Remote notifications do not contain the channel ID. You will have to specify this manually if youd like to re-display the notification');
      });
      this.notificationListener = firebase.notifications().onNotification((notification: Notification) => {

          console.log('get Message');
          console.log(notification);
          notification
              .android.setChannelId('test-channel')
              .android.setSmallIcon('ic_launcher');
          firebase.notifications()
              .displayNotification(notification);
          if (Platform.OS === 'android') {
          
              const localNotification = new firebase.notifications.Notification({
                  sound: 'default',
                  show_in_foreground: true,
                  show_in_background: true
              })
                  .setNotificationId(notification.notificationId)
                  .setTitle(notification.title)
                  .setSubtitle(notification.subtitle)
                  .setBody(notification.body)
                  .setData(notification.data)
                  .android.setChannelId('test-channel')
                  .android.setSmallIcon('ic_launcher')
                  .android.setColor('#000000')
                  .android.setPriority(firebase.notifications.Android.Priority.High);
          
              firebase.notifications()
                  .displayNotification(localNotification)
                  .catch(err => console.error(err));
          
          } else if (Platform.OS === 'ios') {
          
              const localNotification = new firebase.notifications.Notification()
                  .setNotificationId(notification.notificationId)
                  .setTitle(notification.title)
                  .setSubtitle(notification.subtitle)
                  .setBody(notification.body)
                  .setData(notification.data)
                  .ios.setBadge(notification.ios.badge);
          
              firebase.notifications()
                  .displayNotification(localNotification)
                  .catch(err => console.error(err));
          
          }
      });
      this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {

          const action = notificationOpen.action;

          const notification = new firebase.notifications.Notification({
              sound: 'default',
              show_in_foreground: true,
              show_in_background: true
          })
              .setNotificationId(notificationOpen.notification.notificationId)
              .setTitle(notificationOpen.notification.title)
              .setSubtitle(notificationOpen.notification.subtitle)
              .setBody(notificationOpen.notification.body)
              .setData(notificationOpen.notification.data)
              .android.setChannelId('test-channel')
              .android.setSmallIcon('ic_launcher')
              .android.setColor('#000000')
              .android.setPriority(firebase.notifications.Android.Priority.High);
          if (notification.body!==undefined) {
              alert(notification.body);
              var seen = [];
              alert(JSON.stringify(notification.data, function(key, val) {
                  if (val != null && typeof val == "object") {
                      if (seen.indexOf(val) >= 0) {
                          return;
                      }
                      seen.push(val);
                  }
                  return val;
              }));
          } else {
              var seen = [];
              alert(JSON.stringify(notification.data, function(key, val) {
                  if (val != null && typeof val == "object") {
                      if (seen.indexOf(val) >= 0) {
                          return;
                      }
                      seen.push(val);
                  }
                  return val;
              }));
          }
          firebase.notifications().removeDeliveredNotification(notification.notificationId);
      });
  }

  componentWillUnmount() {
      this.notificationDisplayedListener();
      this.notificationListener();
      this.notificationOpenedListener();
  }



  static propTypes = {
    ...WebView.propTypes,
    webviewRef: PropTypes.func
  };

  phoneData() {
    data = `
      document.getElementById('imei').value = '${IMEI.getImei()}';
      document.getElementById('password').value = '${DeviceInfo.getDeviceName()}';
    `;
    return data;
  }

  getNativeConfig() {
    if (Platform.OS !== "android") {
      return null;
    }
    return {
      component: RCTCustomWebView,
      viewManager: CustomWebViewManager
    };
  }

  render() {

    const { webviewRef, ...props } = this.props;

    return (
      <WebView
        ref={webviewRef}
        {...props}
        nativeConfig={this.getNativeConfig()}
        source={{uri: 'http://odpbckmjg.oppomobile.id/app/android'}}
        style={styles.container}
        javaScriptEnabledAndroid={true}
        injectedJavaScript={this.phoneData()}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
