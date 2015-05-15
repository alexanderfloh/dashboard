package util

import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.Date
import play.Logger
import models.NevergreenResult
import scala.util.parsing.json.JSONArray
import scala.util.Try
object JenkinsFetcher {

  def getDetails(json: JsValue, numberOfItems: Integer, baseUrl: String): Future[List[JsObject]] = {

    val buildsJson = (json \ "builds").as[List[JsValue]]
    val builds = buildsJson.map(build => (build \ "number").as[Int]).reverse.takeRight(numberOfItems)
    Future.sequence(builds.map(build => {
      fetchBuild(baseUrl, build)
    }))
  }

  // fetch ci build with tests (core, workbench, kdt)
  def fetchCI(baseUrl: String, mapName: String, numberOfItems: Integer): Future[String] = {
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = getDetails(json, numberOfItems, baseUrl)
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]

      for {
        core <- fetchTests("http://lnz-bobthebuilder/jenkins/job/NTF%20Core%20Regressions")
        workbench <- fetchTests("http://lnz-bobthebuilder/jenkins/job/NTF%20Workbench%20Regressions");
        kdt <- fetchTests("http://lnz-bobthebuilder/jenkins/job/xTF%20KDT%20Regressions");
        lastCompletedDetails <- details
        lastBuildDetails <- fetchLastBuild(baseUrl, lastBuild)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal +
            (("core", core.getOrElse(buildNumber, Json.toJson("")))) +
            (("workbench", workbench.getOrElse(buildNumber, Json.toJson("")))) +
            (("kdt", kdt.getOrElse(buildNumber, Json.toJson(""))))
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests, "lastBuild" -> lastBuildDetails))
      }
    }
  }

  // fetch nightly build with nevergreen list
  def fetchNightly(baseUrl: String, mapName: String, numberOfItems: Integer): Future[String] = {
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = getDetails(json, numberOfItems, baseUrl)
      for {
        lastCompletedDetails <- details
        nevergreensXML <- ScFetcher.fetchNevergreens
      } yield {
        val nevergreens = NevergreensParser.parse(nevergreensXML)
        implicit val nevergreensWrites = NevergreenResult.writes
        Json.prettyPrint(Json.obj(mapName -> lastCompletedDetails, "nevergreens" -> nevergreens))
      }
    }
  }

  // helper
  def mapBuildStatus(status: Option[String]): String =
    status.map(s => s match {
      case "SUCCESS"  => "stable"
      case "FAILURE"  => "failed"
      case "ABORTED"  => "cancelled"
      case "UNSTABLE" => "unstable"
      case _          => s
    }).getOrElse("pending")

  def fetchBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,culprits[fullName],changeSet[items[author[id]]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val authors = (json \ "changeSet" \ "items").asOpt[List[JsValue]].getOrElse(List())
      val ids = authors.map(_ \ "author").distinct
      Json.obj(
        "status" -> mapBuildStatus((json \ "result").asOpt[String]),
        "number" -> buildNumber,
        "culprits" -> (json \ "culprits"),
        "authors" -> ids,
        "link" -> s"$baseUrl/$buildNumber")
    }
  }

  def fetchTests(baseUrl: String): Future[Map[Int, JsValue]] = {
    WS.url(baseUrl + "/api/json?tree=builds[number,url]").get.flatMap { response =>
      val json = Json.parse(response.body)
      val buildsJson = (json \ "builds").as[List[JsValue]]
      val builds = buildsJson.map(build => (build \ "number").as[Int])
      val detailsF = Future.sequence(builds.map(build => {
        fetchTestDetails(baseUrl, build)
      }))
      detailsF.map(details => {
        details.filter(_ != None)
          .map(d => d.get) // unwrap optionals
          .groupBy(_._1) // group by build
          .map { case (k, v) => (k, v.head._2) }
      })
    }
  }

  def fetchTestDetails(baseUrl: String, buildNumber: Int): Future[Option[(Int, JsObject)]] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,actions[causes[upstreamBuild]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val triggeringBuild = (json \\ "upstreamBuild").headOption.map(_.as[Int])
      triggeringBuild.map(build =>
        (build, Json.obj("status" -> mapBuildStatus((json \ "result").asOpt[String]), "link" -> s"$baseUrl/$buildNumber")))
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