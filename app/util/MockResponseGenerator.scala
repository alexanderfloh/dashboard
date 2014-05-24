package util

import scala.concurrent.Future
import play.api.mvc.SimpleResult
import scala.io.Source
import java.util.Date
import scala.io.Codec

object MockResponseGenerator {
  def apply(url: String): String = url match {
    case "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI" =>
      s"""{
          "lastCompletedBuild": {
            "buildNumber":24838,
            "culprits":[],
            "changesetItems":[]
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
    case "http://lnz-bobthebuilder/hudson/job/SilkTest" =>
      Source.fromFile("nightly-full.txt").getLines.mkString
  }
}