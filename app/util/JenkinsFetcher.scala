package util

import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.Date
import play.Logger

object JenkinsFetcher {
  def fetchCi(baseUrl: String): Future[String] = {
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val lastCompletedBuild = (json \ "lastCompletedBuild" \ "number").as[Int]
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]
      val lastSuccessfulBuild = (json \ "lastSuccessfulBuild" \ "number")
      val lastStableBuild = (json \ "lastStableBuild" \ "number")

      for {
        lastCompletedDetails <- fetchLastCompleted(baseUrl, lastCompletedBuild)
        lastBuildDetails <- fetchLastBuild(baseUrl, lastBuild)
      } yield {
        Json.prettyPrint(
          Json.obj(
            "builds" -> Json.arr(
              lastCompletedDetails),
            "building" -> Json.obj(
              "number" -> 1234,
              "authors" -> Json.arr(Json.obj("id" -> "reinholdD")),
              "started" -> new Date().getTime,
              "estimatedDuration" -> 60000)))
      }
    }
  }
  
  def mapBuildStatus(status: String) = status match {
    case "SUCCESS" => "stable"
    case "FAILURE" => "failed"
    case _ => status
  }

  def fetchLastCompleted(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=result,culprits[fullName],changeSet[items[author[id]]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val authors = (json \ "changeSet" \ "items").asOpt[List[JsValue]].getOrElse(List())
      val ids = authors.map(_ \ "author")
      
      Json.obj(
        "status" -> mapBuildStatus((json \ "result").as[String]),
        "number" -> buildNumber,
        "culprits" -> (json \ "culprits"),
        "authors" -> ids)
    }
  }

  def fetchLastBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json"
    WS.url(url).get.map { response =>
      val json = Json.parse(response.body)
      Json.obj(
        "buildNumber" -> buildNumber,
        "estimatedDuration" -> (json \ "estimatedDuration"),
        "timestamp" -> (json \ "timestamp"),
        "building" -> (json \ "building"))
    }
  }
}