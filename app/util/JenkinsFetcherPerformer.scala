package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global

object JenkinsFetcherPerformer extends JenkinsFetcher {

  def prefix = "dashboard.performer."
  // fetch main builds with tests
  def fetchMain(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlTrunk")
      .getOrElse(throw new RuntimeException(prefix + "urlTrunk not configured"))
      
    WS.url(baseUrl + "/api/json").get.flatMap { response =>
      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)
      val lastBuild = (json \ "lastBuild" \ "number").as[Int]

      val urlRegression1 = Play.current.configuration.getString(prefix + "urlRegressionsTrunk")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressionsTrunk not configured"))
      val regressionName1 = Play.current.configuration.getString(prefix + "regressionNameTrunk")
        .getOrElse(throw new RuntimeException(prefix + "regressionNameTrunk not configured"))

      for {
        regression1 <- JenkinsFetcherUtil.fetchTests(urlRegression1, regressionName1)
        lastCompletedDetails <- details
        lastBuildDetails <- JenkinsFetcherUtil.fetchLastBuild(baseUrl, lastBuild)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal +
            (("regression1", regression1._2.getOrElse(buildNumber, Json.toJson(""))))
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests, "lastBuild" -> lastBuildDetails))
      }
    }
  }

  // fetch aside build with regressions
  def fetchAside(mapName: String, numberOfItems: Integer): Future[String] = {
    val baseUrl = Play.current.configuration.getString(prefix + "urlBuildAll")
        .getOrElse(throw new RuntimeException(prefix + "urlBuildAll not configured"))
    WS.url(baseUrl + "/api/json").get.flatMap { response =>

      val json = Json.parse(response.body)
      val details = JenkinsFetcherUtil.getDetails(json, numberOfItems, baseUrl)

      val urlRegression1 = Play.current.configuration.getString(prefix + "urlRegressions1")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions1 not configured"))
      val regressionName1 = Play.current.configuration.getString(prefix + "regressionNameBuildAll1")
        .getOrElse(throw new RuntimeException(prefix + "regressionNameBuildAll1 not configured"))

      val urlRegression2 = Play.current.configuration.getString(prefix + "urlRegressions2")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions2 not configured"))
      val regressionName2 = Play.current.configuration.getString(prefix + "regressionNameBuildAll2")
        .getOrElse(throw new RuntimeException(prefix + "regressionNameBuildAll2 not configured"))

      val urlRegression3 = Play.current.configuration.getString(prefix + "urlRegressions3")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions3 not configured"))
      val regressionName3 = Play.current.configuration.getString(prefix + "regressionNameBuildAll3")
        .getOrElse(throw new RuntimeException(prefix + "regressionNameBuildAll3 not configured"))

      val urlRegression4 = Play.current.configuration.getString(prefix + "urlRegressions4")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions4 not configured"))
      val regressionName4 = Play.current.configuration.getString(prefix + "regressionNameBuildAll4")
        .getOrElse(throw new RuntimeException(prefix + "regressionNameBuildAll4 not configured"))

      val urlRegression5 = Play.current.configuration.getString(prefix + "urlRegressions5")
        .getOrElse(throw new RuntimeException(prefix + "urlRegressions5 not configured"))
      val regressionName5 = Play.current.configuration.getString(prefix + "regressionNameBuildAll5")
        .getOrElse(throw new RuntimeException(prefix + "regressionNameBuildAll5 not configured"))

      for {
        lastCompletedDetails <- details
        regression1 <- JenkinsFetcherUtil.fetchTests(urlRegression1, regressionName1)
        regression2 <- JenkinsFetcherUtil.fetchTests(urlRegression2, regressionName2)
        regression3 <- JenkinsFetcherUtil.fetchTests(urlRegression3, regressionName3)
        regression4 <- JenkinsFetcherUtil.fetchTests(urlRegression4, regressionName4)
        regression5 <- JenkinsFetcherUtil.fetchTests(urlRegression5, regressionName5)
      } yield {
        val detailsWithTests = lastCompletedDetails.map(jsVal => {
          val buildNumber = (jsVal \ "number").as[Int]
          jsVal +
            (("regression1", regression1._2.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression2", regression2._2.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression3", regression3._2.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression4", regression4._2.getOrElse(buildNumber, Json.toJson("")))) +
            (("regression5", regression5._2.getOrElse(buildNumber, Json.toJson(""))))
        });
        Json.prettyPrint(Json.obj(mapName -> detailsWithTests))
      }
    }
  }
}