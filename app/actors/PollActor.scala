package actors

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import akka.actor.Actor
import play.api.Play
import play.api.libs.json.JsObject
import play.api.libs.json.Json
import play.api.libs.json.Json.toJsFieldJsValueWrapper
import play.api.libs.ws.WS
import akka.routing.Broadcast

case object PollCi
case object PollNightly

class PollActor extends Actor {
  val urlCi = Play.current.configuration.getString("dashboard.urlCi")
    .getOrElse(throw new RuntimeException("dashboard.urlCi not configured"))
  val urlNightly = Play.current.configuration.getString("dashboard.urlNightly")
    .getOrElse(throw new RuntimeException("dashboard.urlNightly not configured"))

  val router = context.actorSelection("/user/router")

  def receive = {
    case PollCi => {
      fetchCi(urlCi).map { response =>
        router ! Broadcast(UpdateResponseCi(response))
      }
    }

    case PollNightly => {
      fetchNightly(urlNightly).map { response =>
        router ! Broadcast(UpdateResponseNightly(response))
      }
    }
  }

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
        Json.stringify(
          Json.obj(
            "lastCompletedBuild" -> lastCompletedDetails,
            "lastSuccessfulBuild" -> lastSuccessfulBuild,
            "lastStableBuild" -> lastStableBuild,
            "lastBuild" -> lastBuildDetails))
      }
    }
  }

  def fetchNightly(baseUrl: String): Future[String] = {
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val lastCompletedBuild = (json \ "lastCompletedBuild" \ "number").as[Int]
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]
      val lastSuccessfulBuild = (json \ "lastSuccessfulBuild" \ "number")
      val lastStableBuild = (json \ "lastStableBuild" \ "number")

      for {
        lastCompletedDetails <- fetchLastCompleted(baseUrl, lastCompletedBuild)
      } yield {
        Json.stringify(
          Json.obj(
            "lastCompletedBuild" -> lastCompletedDetails,
            "lastSuccessfulBuild" -> lastSuccessfulBuild,
            "lastStableBuild" -> lastStableBuild))
      }
    }
  }

  def fetchLastCompleted(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=result,culprits[fullName],changeSet[items[*]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      Json.obj(
        "result" -> (json \ "result"),
        "buildNumber" -> buildNumber,
        "culprits" -> (json \ "culprits"),
        "changesetItems" -> (json \ "changeSet" \ "items"))
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