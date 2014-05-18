package util

import scala.concurrent.Future
import play.api.mvc.SimpleResult
import scala.io.Source
import java.util.Date

object MockResponseGenerator {
  def apply(url: String): String =
    url match {
      case "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI/api/json" =>
        Source.fromFile("ci-build-json.txt").getLines.mkString
      case "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI/24731/api/json?tree=culprits[fullName],changeSet[items[*]]" =>
        Source.fromFile("last-build-json.txt").getLines.mkString
      case "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI/24732/api/json" =>
        RunningBuildMock()
      case "http://lnz-bobthebuilder/hudson/job/SilkTest/api/json" =>
        Source.fromFile("ci-build-json.txt").getLines.mkString
      case "http://lnz-bobthebuilder/hudson/job/SilkTest/24731/api/json?tree=culprits[fullName],changeSet[items[*]]" =>
        Source.fromFile("last-build-json.txt").getLines.mkString
    }
}

object RunningBuildMock {
  def apply() = {
    s"""{
  "actions" : [
    {
      "causes" : [
        {
          "shortDescription" : "Started by user Alexander Floh",
          "userId" : "alexanderfl",
          "userName" : "Alexander Floh"
        }
      ]
    },
    {
      
    },
    {
      
    },
    {
      
    }
  ],
  "artifacts" : [
    
  ],
  "building" : true,
  "description" : null,
  "duration" : 0,
  "estimatedDuration" : 1688866,
  "executor" : {
    
  },
  "fullDisplayName" : "SilkTest CI #24732",
  "id" : "2014-05-16_15-58-04",
  "keepLog" : false,
  "number" : 24732,
  "result" : null,
  "timestamp" : ${new Date().getTime - 5 * 60 * 1000},
  "url" : "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI/24732/",
  "builtOn" : "LNZ-BuilderST",
  "changeSet" : {
    "items" : [
      
    ],
    "kind" : "svn",
    "revisions" : [
      {
        "module" : "http://atlis-svn-st/svn/silktest_xp/trunk",
        "revision" : 76695
      }
    ]
  },
  "culprits" : [
    
  ]
}"""
  }
}