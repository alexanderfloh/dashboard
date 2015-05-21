package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.Date
import play.Logger
import models.NevergreenResult
import scala.util.parsing.json.JSONArray
import scala.util.Try

object JenkinsFetcherSilkTest extends JenkinsFetcher {
  def prefix = "dashboard.silktest."
  // fetch main section builds with tests
  def fetchMain(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlCi")
      .getOrElse(throw new RuntimeException(prefix + "urlTrunk not configured"))
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]

      val urlRegression1 = Play.current.configuration.getString(prefix + "urlRegressions1")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions1 not configured"))
      val regressionName1 = Play.current.configuration.getString(prefix + "regressionName1")
        .getOrElse(throw new RuntimeException(prefix + "regressionName1 not configured"))

      val urlRegression2 = Play.current.configuration.getString(prefix + "urlRegressions2")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions2 not configured"))
      val regressionName2 = Play.current.configuration.getString(prefix + "regressionName2")
        .getOrElse(throw new RuntimeException(prefix + "regressionName2 not configured"))

      val urlRegression3 = Play.current.configuration.getString(prefix + "urlRegressions3")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions3 not configured"))
      val regressionName3 = Play.current.configuration.getString(prefix + "regressionName3")
        .getOrElse(throw new RuntimeException(prefix + "regressionName3 not configured"))

      for {
        regression1 <- JenkinsFetcherUtil.fetchTests(urlRegression1, regressionName1)
        regression2 <- JenkinsFetcherUtil.fetchTests(urlRegression2, regressionName2)
        regression3 <- JenkinsFetcherUtil.fetchTests(urlRegression3, regressionName3)
        lastCompletedDetails <- details
        lastBuildDetails <- JenkinsFetcherUtil.fetchLastBuild(baseUrl, lastBuild)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal +
            (("regression1", regression1.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression2", regression2.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression3", regression3.getOrElse(buildNumber, Json.toJson(""))))
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests, "lastBuild" -> lastBuildDetails))
      }
    }
  }

  // fetch aside build with nevergreen list
  def fetchAside(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlNightly")
        .getOrElse(throw new RuntimeException(prefix + "urlBuildAll not configured"))
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
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
}