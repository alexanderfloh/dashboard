package util

import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import models.CiBuild

object JenkinsFetcherUtil {

  def getDetails(json: JsValue, numberOfItems: Integer, baseUrl: String): Future[List[CiBuild]] = {

    val buildsJson = (json \ "builds").as[List[JsValue]]

    val builds = buildsJson.map {
      build => (build \ "number").as[Int]
    }.reverse.takeRight(numberOfItems)

    Future.sequence(builds.map { build =>
      fetchBuild(baseUrl, build)
    })
  }

  def mapBuildStatus(status: Option[String]): String =
    status.map(s => s match {
      case "SUCCESS"  => "stable"
      case "FAILURE"  => "failed"
      case "ABORTED"  => "cancelled"
      case "UNSTABLE" => "unstable"
      case _          => s
    }).getOrElse("pending")

  def fetchTests(baseUrl: String, testName: String): Future[(String, Map[Int, JsValue])] = {
    WS.url(baseUrl + "/api/json?tree=builds[number,url]").get.flatMap { response =>
      val json = Json.parse(response.body)
      val buildsJson = (json \ "builds").as[List[JsValue]]
      val builds = buildsJson.map(build => (build \ "number").as[Int])

      val detailsF = Future.sequence(builds.map { build =>
        fetchTestDetails(baseUrl, build, testName)
      })

      detailsF.map(details => {
        val buildsToJson = details.flatten
          .groupBy { case (buildNumber, json) => buildNumber }
          .map { case (buildNumber, List((_, json))) => (buildNumber, json) }
        (testName, buildsToJson)
      })
    }
  }

  def fetchTestDetails(baseUrl: String, buildNumber: Int, testName: String): Future[Option[(Int, JsObject)]] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,actions[causes[upstreamBuild]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val triggeringBuild = (json \\ "upstreamBuild").headOption.map(_.as[Int])
      triggeringBuild.map(build =>
        (build, Json.obj(
          "status" -> mapBuildStatus((json \ "result").asOpt[String]),
          "link" -> s"$baseUrl/$buildNumber",
          "name" -> testName)))
    }
  }

  def fetchBuild(baseUrl: String, buildNumber: Int): Future[CiBuild] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,building,result,culprits[fullName],actions[parameters[value]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      
      val status = mapBuildStatus((json \ "result").asOpt[String])
      val culprits = ((json \ "culprits").as[List[JsValue]]).map { value =>
        (value \ "fullName").as[String]  
      }
      
      CiBuild(
          buildNumber,
          status,
          culprits,
          s"$baseUrl/$buildNumber",
          (json \ "building").as[Boolean],
          (json \ "timestamp").as[Long],
          (json \ "estimatedDuration").as[Long]
      )
    }
  }
}