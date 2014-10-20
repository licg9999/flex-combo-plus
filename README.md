# Flex Combo Plus 简介

## 介绍

从Flex Combo项目修改而来的Flex Combo Plus，在保持原有功能不变的基础上进行了增强。

## 致谢

对wayfind、bachi、paulguo、limingv5及他们维护的Flex Combo致以感谢！

# Flex Combo 介绍

## 介绍

Combo技术最初出现源于[《高性能网站建设指南》](http://book.douban.com/subject/3132277/)的规则一所提到“减少HTTP请求"，是一个在服务端提供，合并多个文件请求在一个响应中的技术。
在生产环境中，Combo功能有很多实现，例如[Tengine](http://tengine.taobao.org/document_cn/http_concat_cn.html)。 
在前端开发环境中，由于最终上线需要将资源引入的代码合并，从而无法在本地轻量开发调试，引起开发调试不便。
Flex Combo是在开发环境模拟实现了此功能的服务器，目的是方便前端开发调试。约等于一个支持Combo语法，只能访问js/css及图片资源的Apache服务器。
区别于生产环境的Combo。Flex Combo专为前端开发环境量身打造，舍弃部分高并发特性，从而提供了丰富的功能和轻量的体积。

## 参考

[Flex Combo](https://github.com/wayfind/flex-combo)