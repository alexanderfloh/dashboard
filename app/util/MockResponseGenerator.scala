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
      }
    ]"""

      s"""{
          "lastCompletedBuild": {
            "buildNumber":24838,
            "culprits":[],
            "changesetItems": $changeSetItems
          },
          "lastSuccessfulBuild": 24838,
          "lastStableBuild": 24838,
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