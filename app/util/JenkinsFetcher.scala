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
      val buildsJson = (json \ "builds").as[List[JsValue]]
      val builds = buildsJson.map(build => (build \ "number").as[Int]).reverse.takeRight(10)

      val details = Future.sequence(builds.map(build => {
        fetchBuild(baseUrl, build)
      }))
      for {
        tests <- fetchTests("http://lnz-bobthebuilder/jenkins/job/NTF%20Core%20Regressions")
        lastCompletedDetails <- details
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal + (("tests", tests.getOrElse(buildNumber, Json.toJson(""))))
        })
        Json.prettyPrint(Json.obj("builds" -> detailsWithTests))
      }
    }
  }

  def mapBuildStatus(status: Option[String]): String = 
    status.map(s => s match {
    case "SUCCESS" => "stable"
    case "FAILURE" => "failed"
    case "ABORTED" => "cancelled"
    case "UNSTABLE" => "unstable"
    case _ => s
    }).getOrElse("pending")
  

  def fetchBuild(baseUrl: String, buildNumber: Int): Future[JsObject] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,culprits[fullName],changeSet[items[author[id]]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val authors = (json \ "changeSet" \ "items").asOpt[List[JsValue]].getOrElse(List())
      val ids = authors.map(_ \ "author").distinct
      println((json\"result").asOpt[String])
      Json.obj(
        "status" -> mapBuildStatus((json \ "result").asOpt[String]),
        "number" -> buildNumber,
        "culprits" -> (json \ "culprits"),
        "authors" -> ids)
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
          .map{case (k, v) => (k, v.head._2)}
      })
    }
  }

  def fetchTestDetails(baseUrl: String, buildNumber: Int): Future[Option[(Int, JsObject)]] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,estimatedDuration,result,actions[causes[upstreamBuild]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val triggeringBuild = (json \\ "upstreamBuild").headOption.map(_.as[Int])
      triggeringBuild.map(build =>
        (build, Json.obj("status" -> mapBuildStatus((json \ "result").asOpt[String]))))
    }
  }

}