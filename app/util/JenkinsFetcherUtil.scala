package util

import scala.concurrent.Future
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import models.CiBuild
import play.api.Play
import play.mvc.Http
import play.Logger

object JenkinsFetcherUtil {

  def prefix = "dashboard.silktest."

  type BuildNumber = Int
  type BuildUrl = String

  case class BuildInfo(buildNumber: BuildNumber, buildUrl: BuildUrl)

  object BuildInfo {
    def apply(info: (BuildNumber, BuildUrl)): BuildInfo = apply(info._1, info._2)
  }

  def getDetailsForJob(baseUrl: String, numberOfItems: Int = 1) = {
    val url = baseUrl + "/api/json"
    WS.url(url).get.flatMap { response =>
      if (response.status == 200) {
    	  val json = Json.parse(response.body)
    			  val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
    			  for { details <- details } yield {
    				  (json, details)
    			  }
      } else {
    	  throw new RuntimeException(s"error getting $url: ${response.statusText}")
      }
    }
  }

  private def getDetails(json: JsValue, numberOfItems: Integer, baseUrl: String): Future[List[CiBuild]] = {
    val buildsJson = (json \ "builds").as[List[JsValue]]
    val builds = buildsJson.map {
      build => (build \ "number").as[Int]
    }.reverse.takeRight(numberOfItems)

    Future.sequence(builds.map { build =>
      fetchBuild(baseUrl, build)
    })
  }

  private def mapBuildStatus(status: Option[String]): String =
    status.map(s => s match {
      case "SUCCESS"  => "stable"
      case "FAILURE"  => "failed"
      case "ABORTED"  => "cancelled"
      case "UNSTABLE" => "unstable"
      case _          => s
    }).getOrElse("pending")

  def fetchTests(baseUrl: String, testName: String): Future[(String, Map[Int, JsValue])] = {
    for {
      builds <- getListOfBuilds(baseUrl)
      details <- Future.sequence(builds.map { build =>
        fetchTestDetails(build, testName)
      })
    } yield {
      val buildsToJson = details.flatten
        .groupBy { case (buildNumber, json) => buildNumber }
        .map { case (buildNumber, (_, json) :: _) => (buildNumber, json) }
      (testName, buildsToJson)
    }
  }

  private def getListOfBuilds(baseUrl: String): Future[List[BuildInfo]] = {
    WS.url(baseUrl + "/api/json?tree=builds[number,url]").get.map { response =>
      val json = Json.parse(response.body)
      val buildsJson = (json \ "builds").as[List[JsValue]]
      buildsJson.map(build =>
        ((build \ "number").as[Int],
          (build \ "url").as[String]))
        .map(BuildInfo.apply)
    }
  }

  private def fetchTestDetails(build: BuildInfo, testName: String): Future[Option[(Int, JsObject)]] = {
    val url = s"${build.buildUrl}api/json?tree=timestamp,estimatedDuration,result,actions[causes[upstreamBuild]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)
      val triggeringBuild = (json \\ "upstreamBuild").headOption.map(_.as[Int])
      triggeringBuild.map(buildNumber =>
        (buildNumber, Json.obj(
          "status" -> mapBuildStatus((json \ "result").asOpt[String]),
          "link" -> build.buildUrl,
          "name" -> testName)))
    }
  }

  private def fetchBuild(baseUrl: String, buildNumber: Int): Future[CiBuild] = {
    val url = s"$baseUrl/$buildNumber/api/json?tree=timestamp,description,estimatedDuration,building,result,culprits[fullName],changeSets[items[author[fullName]]],actions[parameters[value]]"
    WS.url(url).get.map { responseDetails =>
      val json = Json.parse(responseDetails.body)

      val status = mapBuildStatus((json \ "result").asOpt[String])
      val culpritsPipeline = (json \\ "author" ).map(jsValue => (jsValue\ "fullName").asOpt[String]).distinct.toList.flatten
      
      val culpritsOld = ((json \ "culprits").asOpt[List[JsValue]]).map(_.map { value =>
      (value \ "fullName").as[String]}).getOrElse(List())
      
      val culprits = culpritsPipeline ++ culpritsOld
      
      CiBuild(
        buildNumber,
        status,
        (json \ "description").as[Option[String]],
        culprits,
        s"$baseUrl/$buildNumber",
        (json \ "building").as[Boolean],
        (json \ "timestamp").as[Long],
        (json \ "estimatedDuration").as[Long])
    }
  }
}