package util

import scala.concurrent.Future
import play.api.mvc.SimpleResult
import scala.io.Source
import java.util.Date
import scala.io.Codec

object MockResponseGenerator {
  def apply(url: String): String = url match {
    case "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI" => {
      val changeSetItems =
        """[
      {
        "affectedPaths" : [
          "OpenAgent/SrcJava/plugins/com.borland.fastxd.integration.xp/src/com/borland/fastxd/integration/xp/functions/AgentClassFunction.java",
          "SilkTestClassic/src/startup/winclass.inc"
        ],
        "author" : {
          "absoluteUrl" : "http://lnz-bobthebuilder/hudson/user/MichaelG",
          "fullName" : "Michael Gehmayr"
        },
        "commitId" : "76695",
        "timestamp" : 1400237433062,
        "date" : "2014-05-16T10:50:33.062367Z",
        "msg" : "+ Agent.ShutDown() method for 4Test (US9116 US - RFE - Expose stop/start Open Agent)",
        "paths" : [
          {
            "editType" : "edit",
            "file" : "/trunk/OpenAgent/SrcJava/plugins/com.borland.fastxd.integration.xp/src/com/borland/fastxd/integration/xp/functions/AgentClassFunction.java"
          },
          {
            "editType" : "edit",
            "file" : "/trunk/SilkTestClassic/src/startup/winclass.inc"
          }
        ],
        "revision" : 76695,
        "user" : "Michael Gehmayr"
      },
      {"affectedPaths":["OpenAgent/SrcJava/plugins/com.borland.fastxd.agent/src/com/borland/fastxd/agent/core/ApplicationService.java","OpenAgent/SrcJava/plugins/com.microfocus.silktest.mobile/src/com/microfocus/silktest/mobile/AbstractCommunicationTunnel.java","OpenAgent/SrcJava/plugins/com.microfocus.silktest.techdomain.android.agent/src/com/microfocus/silktest/techdomain/android/agent/device/DeviceConnection.java","OpenAgent/SrcJava/plugins/com.microfocus.silktest.techdomain.ios.agent/src/com/microfocus/silktest/techdomain/ios/agent/device/CommunicationTunnel.java"],"author":{},"commitId":"76840","timestamp":1400775208853,"date":"2014-05-22T16:13:28.853725Z",
        "msg":"+Android: fix shutdown deadlock by prohibiting sending synchronous UIAutomator messages to the device as soon it is disconnected. This is the case if pending calls exist on disconnect or when the agent is stopped during a test run (see DeviceConnection.java for Android).\no set some threads to deamon threads and add log output. \n(paired with MichaelG)","paths":[{},{},{},{}],"revision":76840,"user":"Gerald Ehmayr"}
    ]"""

      val culprits = List("Michael Gehmayr", "Alexander Floh")
        .map(name => s"""{"fullName": "$name"}""").mkString("[", ",", "]")

      s"""{
          "lastCompletedBuild": {
            "buildNumber":24838,
            "culprits": $culprits,
            "changesetItems": $changeSetItems
          },
          "lastSuccessfulBuild": 24837,
          "lastStableBuild": 24837,
          "lastBuild": {
            "buildNumber": 24839,
            "estimatedDuration": 1365751,
            "timestamp": ${new Date().getTime - 5 * 60 * 1000},
            "building":true
          }
        }"""
    }
    case "http://lnz-bobthebuilder/hudson/job/SilkTest" =>
      Source.fromFile("nightly-full.txt").getLines.mkString
  }
}